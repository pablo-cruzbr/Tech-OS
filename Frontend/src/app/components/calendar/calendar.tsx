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

  const pendingRef = useRef<PendingReschedule | null>(null);

  const parseToScheduler = useCallback((data: any[]) => {
    return data.map((os: any) => {
      console.log(`[CAL] parseToScheduler OS ${os.numeroOS} → agendadoEm: ${os.agendadoEm} | created_at: ${os.created_at}`);
      const startDate = os.agendadoEm
        ? new Date(os.agendadoEm)
        : new Date(os.created_at);

      return {
        id: os.id,
        text: `OS ${os.numeroOS}: ${os.cliente?.name || "Chamado"}`,
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

      if (containerRef.current) {
        scheduler.init(containerRef.current, new Date(), "month");
        isInitialized.current = true;
        setSchedulerReady(true);
      }

      scheduler.attachEvent("onClick", (id: string) => {
        const ev = scheduler.getEvent(id);
        if (ev?.rawTicket) {
          openModal("OrdemdeServico", [ev.rawTicket]);
        }
        return false;
      });

      let oldDateBeforeMove: Date | null = null;

      scheduler.attachEvent(
        "onBeforeEventChanged",
        (_ev: any, _e: any, is_new: boolean, original: any) => {
          // Bloqueia nova movimentação se já tem uma pendente
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

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(d));

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

      <div
        ref={containerRef}
        className="dhx_cal_container shadow-sm border rounded-xl"
        style={{ width: "100%", height: "600px", backgroundColor: "#fff" }}
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