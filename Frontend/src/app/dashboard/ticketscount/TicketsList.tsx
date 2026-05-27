'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LuRefreshCcw } from "react-icons/lu";
import styles from './ticketsLit.module.scss';
import { OrdemdeServicoResponseData } from '@/lib/getOrdemdeServico.type';

const Calendar = dynamic(() => import('../../components/calendar/calendar'), { 
  ssr: false 
});

interface Props {
  ticketsData: OrdemdeServicoResponseData;
  tokenDoServidor?: string; 
}

export default function TicketsList({ ticketsData, tokenDoServidor }: Props) {
  const router = useRouter();

  const {
    total = 0,
    totalAberta = 0,
    totalEmAndamento = 0,
    totalConcluida = 0,
  } = ticketsData || {};

  const handleRefresh = () => router.refresh();
  const handleListTickets = () => router.push('/dashboard/tickets');

  return (
    <>
      <div className={styles.headerClient}>
        <h1 className={styles.titleClient}>Visualize seus Tickets ou Ordens de Serviço</h1>
        <div className={styles.actions}>
          <button className={styles.button} onClick={handleListTickets}>
            Lista de Chamados
          </button>
          <LuRefreshCcw onClick={handleRefresh} className={styles.refresh} />
        </div>
      </div>

    {/* 
  <div className={styles.cardsContainer}>
    <div className={styles.card}>
      <p className={styles.cardTitle}>Total</p>
      <strong className={styles.cardNumber}>{total}</strong>
    </div>

    <div className={styles.card}>
      <p className={styles.cardTitle}>OS Aberta</p>
      <strong className={styles.cardNumber}>{totalAberta}</strong>
    </div>

    <div className={styles.card}>
      <p className={styles.cardTitle}>OS em Andamento</p>
      <strong className={styles.cardNumber}>{totalEmAndamento}</strong>
    </div>

    <div className={styles.card}>
      <p className={styles.cardTitle}>OS Concluída</p>
      <strong className={styles.cardNumber}>{totalConcluida}</strong>
    </div>
  </div> 
*/}
   
      <div className={styles.headerClient} style={{ marginTop: '40px' }}>
        <h1 className={styles.titleClient}>Calendário Técnico</h1>
        <Calendar initialToken={tokenDoServidor} />
      </div>
    </>
  );
}