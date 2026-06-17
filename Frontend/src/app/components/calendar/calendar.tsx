"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { api } from "@/services/api";
import { getCookieClient } from "@/lib/cookieClient";
import { useGlobalModal } from "@/provider/GlobalModalProvider";

import "dhtmlx-scheduler/codebase/dhtmlxscheduler.css";
import "./calendar.css";
import styles from "./calendarModal.module.scss";

interface CalendarProps {
  initialToken?: string;
  events?: any[];
}

interface PendingReschedule {
  id: string;
  newDate: Date;
  oldDate: Date;
}

export default function Calendar({ initialToken, events }: CalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const schedulerInstance = useRef<any>(null);
  const isInitialized = useRef(false);
  const { openModal } = useGlobalModal();

  const [pending, setPending] = useState<PendingReschedule | null>(null);
  const [saving, setSaving] = useState(false);
  const [schedulerReady, setSchedulerReady] = useState(false);
  const [morePopup, setMorePopup] = useState<{
    date: Date;
    events: any[];
    top: number;
    left: number;
  } | null>(null);
  const [isDraggingPopupEvent, setIsDraggingPopupEvent] = useState(false);

  const pendingRef = useRef<PendingReschedule | null>(null);

  const parseToScheduler = useCallback((data: any[]) => {
    return data.map((os: any) => {
      console.log(`[CAL] parseToScheduler OS ${os.numeroOS} → agendadoEm: ${os.agendadoEm} | created_at: ${os.created_at}`);
      const startDate = os.agendadoEm
        ? new Date(os.agendadoEm)
        : new Date(os.created_at);

      return {
        id: os.id,
        text:
          os.instituicaoUnidade?.name ||
          os.informacoesSetor?.instituicaoUnidade?.name ||
          os.user?.instituicaoUnidade?.name ||
          os.cliente?.name ||
          `OS ${os.numeroOS}`,
        start_date: startDate,
        end_date: new Date(startDate.getTime() + 30 * 60 * 1000),
        color: os.statusOrdemdeServico?.name === "CONCLUIDA" ? "#10b981" : "#f59e0b",
        rawTicket: os,
      };
    });
  }, []);

  const updateEventOnServer = async (id: string, newDate: Date) => {
    const token = initialToken || (await getCookieClient());
    console.log("[CAL] updateEventOnServer → id:", id, "| newDate:", newDate.toISOString(), "| token:", token ? "ok" : "MISSING");
    const response = await api.patch(
      `/ordemdeservico/update/${id}`,
      { agendadoEm: newDate.toISOString() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("[CAL] PATCH response status:", response.status);
    console.log("[CAL] PATCH agendadoEm salvo:", response.data?.ordem?.agendadoEm);
    return response;
  };

  const handleConfirm = async () => {
    console.log("[CAL] handleConfirm chamado | pendingRef:", pendingRef.current);
    if (!pendingRef.current) {
      console.warn("[CAL] handleConfirm: pendingRef é null, abortando");
      return;
    }
    const { id, newDate } = pendingRef.current;
    console.log("[CAL] Confirmando reagendamento → id:", id, "| newDate:", newDate);
    setSaving(true);
    try {
      await updateEventOnServer(id, newDate);
      console.log("[CAL] PATCH concluído com sucesso");

      const scheduler = schedulerInstance.current;
      if (scheduler) {
        const ev = scheduler.getEvent(id);
        if (ev?.rawTicket) {
          ev.rawTicket.agendadoEm = newDate.toISOString();
        }
      }
    } catch (err: any) {
      console.error("[CAL] ERRO no PATCH:", err?.response?.status, err?.response?.data ?? err?.message ?? err);
      revertEvent(pendingRef.current);
    } finally {
      setSaving(false);
      pendingRef.current = null;
      setPending(null);

      const scheduler = schedulerInstance.current;
      if (scheduler) {
        scheduler.config.drag_move = true;
        scheduler.config.readonly = false;
      }
    }
  };

  const revertEvent = (p: PendingReschedule) => {
    const scheduler = schedulerInstance.current;
    if (!scheduler) return;
    const ev = scheduler.getEvent(p.id);
    if (ev) {
      ev.start_date = new Date(p.oldDate);
      ev.end_date = new Date(p.oldDate.getTime() + 30 * 60 * 1000);
      scheduler.updateEvent(p.id);
    }
  };

  const handleCancel = () => {
    if (!pendingRef.current) return;
    revertEvent(pendingRef.current);
    pendingRef.current = null;
    setPending(null);

    // Reativa o drag após cancelar
    const scheduler = schedulerInstance.current;
    if (scheduler) {
      scheduler.config.drag_move = true;
      scheduler.config.readonly = false;
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || isInitialized.current) return;

    const initScheduler = async () => {
      const schedulerModule = await import("dhtmlx-scheduler");
      const scheduler = schedulerModule.default;
      schedulerInstance.current = scheduler;

      scheduler.i18n.setLocale("pt");
      scheduler.skin = "terrace";
      scheduler.config.readonly = false;
      scheduler.config.drag_resize = false; // desativa resize, só move
      scheduler.config.drag_move = true;
      scheduler.config.header = ["day", "week", "month", "date", "prev", "today", "next"];
      scheduler.config.max_month_events = 4;

      // v7: signature is (date, hiddenCount) — not a config object
      scheduler.templates.month_events_link = (_date: any, count: number) => {
        return `<a class="dhx_cal_more_link" style="cursor:pointer;color:#4E3182;font-size:11px;font-weight:600;display:block;padding:1px 4px;">mais +${count}</a>`;
      };

      if (containerRef.current) {
        scheduler.init(containerRef.current, new Date(), "month");
        isInitialized.current = true;
        setSchedulerReady(true);

        containerRef.current.addEventListener(
          "click",
          (e: MouseEvent) => {
            // catch both: my override class and DHTMLX's default class
            const link = (e.target as HTMLElement).closest(
              ".dhx_cal_more_link, .dhx_more_events"
            ) as HTMLElement | null;
            if (!link) return;
            e.stopPropagation();
            e.preventDefault();

            // The "mais" link is absolutely positioned by DHTMLX outside the cell DOM,
            // so DOM traversal finds the wrong ancestor. Instead, use screen position:
            // find the .dhx_month_head that is directly above the link and horizontally aligned.
            const linkRect = link.getBoundingClientRect();
            const heads = Array.from(
              containerRef.current!.querySelectorAll(".dhx_month_head")
            ) as HTMLElement[];

            let bestHead: HTMLElement | null = null;
            let bestDist = Infinity;
            for (const head of heads) {
              const hr = head.getBoundingClientRect();
              if (hr.bottom > linkRect.top) continue; // head must be above the link
              const overlap = Math.min(hr.right, linkRect.right) - Math.max(hr.left, linkRect.left);
              if (overlap <= 0) continue; // must share horizontal space (same column)
              const dist = linkRect.top - hr.bottom;
              if (dist < bestDist) { bestDist = dist; bestHead = head; }
            }

            const dayNum = parseInt(bestHead?.textContent?.trim() ?? "0", 10);
            if (!dayNum) return;

            const state = scheduler.getState();
            const viewDate: Date = state.date;
            const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNum);

            const start = new Date(cellDate); start.setHours(0, 0, 0, 0);
            const end = new Date(cellDate); end.setHours(23, 59, 59, 999);
            const evs: any[] = scheduler.getEvents(start, end);
            evs.sort((a: any, b: any) => +a.start_date - +b.start_date);

            const rect = link.getBoundingClientRect();
            const POPUP_H = 360;
            let top = rect.bottom + 6;
            if (top + POPUP_H > window.innerHeight - 8) top = rect.top - POPUP_H - 6;
            let left = rect.left;
            if (left + 320 > window.innerWidth - 8) left = window.innerWidth - 328;
            setMorePopup({ date: cellDate, events: evs, top, left });
          },
          true
        );
      }

      scheduler.attachEvent("onClick", (id: string) => {
        const ev = scheduler.getEvent(id);
        if (ev?.rawTicket) {
          openModal("OrdemdeServico", [ev.rawTicket]);
        }
        return false;
      });

      scheduler.attachEvent("onBeforeEventCreated", () => false);

      let oldDateBeforeMove: Date | null = null;

      scheduler.attachEvent(
        "onBeforeEventChanged",
        (_ev: any, _e: any, is_new: boolean, original: any) => {
          if (pendingRef.current) return false;
          if (!is_new) {
            oldDateBeforeMove = new Date(original.start_date);
          }
          return true;
        }
      );

      scheduler.attachEvent("onEventChanged", (_id: string, ev: any) => {
        console.log("[CAL] onEventChanged → ev.id:", ev.id, "| start_date:", ev.start_date, "| oldDateBeforeMove:", oldDateBeforeMove);
        const p: PendingReschedule = {
          id: String(ev.id),
          newDate: new Date(ev.start_date),
          oldDate: oldDateBeforeMove ?? new Date(ev.start_date),
        };
        console.log("[CAL] pending gerado:", p);
        pendingRef.current = p;
        setPending(p);

        // Desativa drag enquanto modal está aberto
        scheduler.config.drag_move = false;

        return true;
      });
    };

    initScheduler();
  }, [parseToScheduler, initialToken, openModal]);

  useEffect(() => {
    if (!schedulerReady || !schedulerInstance.current) return;
    console.log("[CAL] sync events effect → events.length:", events?.length ?? 0);
    if (events?.[0]) {
      const first = events[0] as any;
      console.log("[CAL] primeiro evento raw keys:", Object.keys(first));
      console.log("[CAL] primeiro evento agendadoEm:", first.agendadoEm, "| type:", typeof first.agendadoEm);
      console.log("[CAL] primeiro evento created_at:", first.created_at);
    }
    const scheduler = schedulerInstance.current;
    scheduler.clearAll();
    if (events && events.length > 0) {
      scheduler.parse(parseToScheduler(events));
    } else {
      const fetch = async () => {
        const token = initialToken || (await getCookieClient());
        if (token) {
          const { data } = await api.get("/listordemdeservico", {
            headers: { Authorization: `Bearer ${token}` },
          });
          scheduler.parse(parseToScheduler(data?.controles || []));
        }
      };
      fetch();
    }
  }, [schedulerReady, events, parseToScheduler, initialToken]);

  // Drag-and-drop from popup onto calendar cells
  useEffect(() => {
    if (!schedulerReady || !containerRef.current) return;
    const container = containerRef.current;

    const handleDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes("application/popup-os")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: DragEvent) => {
      const evId = e.dataTransfer?.getData("application/popup-os");
      if (!evId) return;
      e.preventDefault();

      // Find which day cell the user dropped onto using header positions
      const heads = Array.from(container.querySelectorAll(".dhx_month_head")) as HTMLElement[];
      let bestHead: HTMLElement | null = null;
      for (const head of heads) {
        const hr = head.getBoundingClientRect();
        if (e.clientX < hr.left || e.clientX > hr.right) continue;
        if (e.clientY < hr.top) continue;
        if (!bestHead || hr.top > bestHead.getBoundingClientRect().top) bestHead = head;
      }
      const dayNum = parseInt(bestHead?.textContent?.trim() ?? "0", 10);
      if (!dayNum) { setIsDraggingPopupEvent(false); return; }

      const scheduler = schedulerInstance.current;
      const state = scheduler?.getState();
      if (!state) { setIsDraggingPopupEvent(false); return; }

      const cellDate = new Date(state.date.getFullYear(), state.date.getMonth(), dayNum);
      const ev = scheduler.getEvent(evId);
      if (!ev) { setIsDraggingPopupEvent(false); return; }

      const orig: Date = ev.start_date;
      const newDate = new Date(
        cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate(),
        orig.getHours(), orig.getMinutes(), 0, 0
      );

      try {
        await updateEventOnServer(evId, newDate);
        const duration = +ev.end_date - +ev.start_date;
        ev.start_date = newDate;
        ev.end_date = new Date(+newDate + duration);
        if (ev.rawTicket) ev.rawTicket.agendadoEm = newDate.toISOString();
        scheduler.updateEvent(evId);
        setMorePopup(null);
      } catch (err) {
        console.error("[CAL] Erro ao reagendar via drag:", err);
      } finally {
        setIsDraggingPopupEvent(false);
      }
    };

    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);
    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
    };
  }, [schedulerReady, initialToken]);

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(d));

  const formatTime = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(d));

  return (
    <div style={{ width: "100%", marginTop: "20px" }}>

      {pending && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2 className={styles.title}>Confirmar reagendamento</h2>

            <div className={styles.infoBox}>
              <p className={styles.infoRow}>
                <strong>De:</strong> {formatDate(pending.oldDate)}
              </p>
              <p className={styles.infoRow}>
                <strong>Para:</strong> {formatDate(pending.newDate)}
              </p>
            </div>

            <div className={styles.actions}>
              <button
                onClick={handleCancel}
                disabled={saving}
                className={styles.btnCancel}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className={styles.btnConfirm}
              >
                {saving ? (
                  <>
                    <span className={styles.spinner} />
                    Salvando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {morePopup && (
        <>
          <div
            className={styles.moreBackdrop}
            onClick={() => setMorePopup(null)}
            style={{ pointerEvents: isDraggingPopupEvent ? "none" : "auto" }}
          />
          <div
            className={styles.morePopup}
            style={{ top: morePopup.top, left: morePopup.left }}
          >
            <div className={styles.morePopupHeader}>
              <span>{formatDate(morePopup.date)}</span>
              <button className={styles.morePopupClose} onClick={() => setMorePopup(null)}>✕</button>
            </div>
            <div className={styles.morePopupList}>
              {morePopup.events.map((ev: any) => (
                <div
                  key={ev.id}
                  className={styles.morePopupItem}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/popup-os", ev.id);
                    e.dataTransfer.effectAllowed = "move";
                    setIsDraggingPopupEvent(true);
                  }}
                  onDragEnd={() => setIsDraggingPopupEvent(false)}
                  onClick={() => {
                    if (ev.rawTicket) openModal("OrdemdeServico", [ev.rawTicket]);
                    setMorePopup(null);
                  }}
                >
                  <span className={styles.morePopupDot} style={{ background: ev.color }} />
                  <span className={styles.morePopupTime}>{formatTime(ev.start_date)}</span>
                  <span className={styles.morePopupText}>
                    {ev.text}{ev.rawTicket?.tecnico?.name ? ` – ${ev.rawTicket.tecnico.name}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div
        ref={containerRef}
        className="dhx_cal_container shadow-sm border rounded-xl"
        style={{ width: "100%", height: "750px", backgroundColor: "#fff" }}
      >
        <div className="dhx_cal_navline">
          <div className="dhx_cal_prev_button">&nbsp;</div>
          <div className="dhx_cal_next_button">&nbsp;</div>
          <div className="dhx_cal_today_button"></div>
          <div className="dhx_cal_date"></div>
          <div className="dhx_cal_tab" data-tab="day"></div>
          <div className="dhx_cal_tab" data-tab="week"></div>
          <div className="dhx_cal_tab" data-tab="month"></div>
        </div>
        <div className="dhx_cal_header"></div>
        <div className="dhx_cal_data"></div>
      </div>
    </div>
  );
}