'use client';

import React, { useEffect, useState } from 'react';
import TicketsCount from './TicketsCount';
import { OrdemdeServicoResponseData } from '@/lib/getOrdemdeServico.type';
import { getCookieClient } from '@/lib/cookieClient';
import { api } from '@/services/api';

export default function TicketsPage() {
  const [ticketsData, setTicketsData] = useState<OrdemdeServicoResponseData | null>(null);

  useEffect(() => {
    async function fetchTickets() {
      const token = await getCookieClient();
      if (!token) return;

      try {
        const response = await api.get('/listordemdeservico', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTicketsData(response.data);
      } catch (err) {
        console.error("❌ Erro ao buscar tickets:", err);
      }
    }

    fetchTickets();
  }, []);

  if (!ticketsData) return <p>Carregando tickets...</p>;

  return <TicketsCount ticketsData={ticketsData} />;
}
