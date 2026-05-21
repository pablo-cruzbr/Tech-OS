"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import { getCookieClient } from "@/lib/cookieClient";
import { useGlobalModal } from "@/provider/GlobalModalProvider"; 

import "dhtmlx-scheduler/codebase/dhtmlxscheduler.css";
import "./calendar.css"; 

interface CalendarProps {
  initialToken?: string;
  events?: any[]; 
}

export default function Calendar({ initialToken, events }: CalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const schedulerInstance = useRef<any>(null);
  const isInitialized = useRef(false);
  const router = useRouter();
  const { openModal } = useGlobalModal();

  
  const parseToScheduler = useCallback((data: any[]) => {
    return data.map((os: any) => {
      const startDate = new Date(os.created_at);
      
      return {
        id: os.id,
        text: `OS ${os.numeroOS}: ${os.cliente?.name || "Chamado"}`,
        start_date: startDate,
        // Forçamos o fim a ser apenas 30 minutos após o início do mesmo dia
        end_date: new Date(startDate.getTime() + 30 * 60 * 1000), 
        color: os.statusOrdemdeServico?.name === "CONCLUIDA" ? "#10b981" : "#f59e0b",
        rawTicket: os
      };
    });
  }, []);


  const updateEventOnServer = async (ev: any) => {
    const token = initialToken || (await getCookieClient());
    try {
      await api.patch(`/ordens/${ev.id}`, {
        created_at: ev.start_date,
        endedAt: ev.end_date
      }, { headers: { Authorization: `Bearer ${token}` }});
    } catch (err) {
      console.error("Erro ao atualizar data:", err);
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
      scheduler.config.drag_resize = true;
      scheduler.config.drag_move = true;
      
      scheduler.config.header = ["day", "week", "month", "date", "prev", "today", "next"];
      
      if (containerRef.current) {
        scheduler.init(containerRef.current, new Date(), "month");
        isInitialized.current = true;

        if (events && events.length > 0) {
          scheduler.parse(parseToScheduler(events));
        } else {
          const token = initialToken || (await getCookieClient());
          if (token) {
            const { data } = await api.get("/ordens", { headers: { Authorization: `Bearer ${token}` }});
            scheduler.parse(parseToScheduler(data?.controles || []));
          }
        }
      }

      // Evento de Clique chamando o Modal Global
      scheduler.attachEvent("onClick", (id: string) => {
        const ev = scheduler.getEvent(id);
        if (ev && ev.rawTicket) {
          // Chamando seu modal global passando o ticket
          openModal('OrdemdeServico', [ev.rawTicket]); 
        }
        return false; 
      });

      scheduler.attachEvent("onEventChanged", (id: string, ev: any) => {
        updateEventOnServer(ev);
        return true;
      });
    };

    initScheduler();
  }, [events, parseToScheduler, initialToken, openModal]);

  return (
    <div style={{ width: "100%", marginTop: "20px" }}>
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