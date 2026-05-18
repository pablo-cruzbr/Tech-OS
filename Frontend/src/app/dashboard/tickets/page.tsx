import { getCookieServer } from "@/lib/cookieServer";
import { api } from "@/services/api";
import TicketsList from "./TicketsList";
import { cookies } from "next/headers"; 
import { redirect } from "next/navigation";

import { OrdemdeServicoProps, OrdemdeServicoResponseData } from "@/lib/getOrdemdeServico.type";
export const dynamic = 'force-dynamic';
async function getTickets(): Promise<OrdemdeServicoResponseData> {
  try {
    const token = await getCookieServer();
    console.log("Token pego no client:", token);
    const response = await api.get('/listordemdeservico', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(response);
    return response.data || { controles: [], total: 0, totalAberta: 0, totalEmDeslocamento: 0, totalConcluida: 0, totalEmAndamento: 0 };

  } catch (err) {
    console.error(err);
    return {controles: [], 
    total: 0, 
    totalAberta: 0, 
    totalEmDeslocamento: 0,
    totalConcluida: 0, 
    totalEmAndamento: 0, 
    totalPausada: 0,
    totalTicket: 0,
    totalOrdemdeServico: 0 }; 
  }
}

export default async function TicketsPage() {
  const ticketsData = await getTickets();
    const token = await getCookieServer();
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;
  
    if (role !== "TECNICO" && role !== "ADMIN") {
      redirect("/");
    }
      

  return (
    <TicketsList ticketsData={ticketsData} />
  );
}
