'use client';

import React, { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ticketsLit.module.scss';
import { FaRegTrashAlt } from "react-icons/fa";
import { IoDocumentTextOutline } from "react-icons/io5";
import { LuRefreshCcw } from "react-icons/lu";
import { OrdemdeServicoResponseData, OrdemdeServicoProps } from '@/lib/getOrdemdeServico.type';
import { getCookieClient } from '@/lib/cookieClient';
import { api } from '@/services/api';
import { useGlobalModal } from '@/provider/GlobalModalProvider';
import { ModalContext } from '@/provider/compras';
import { exportOrdemServicoExcel } from '@/lib/exportExcel';
import { RiFileExcel2Line } from "react-icons/ri";
import { toast } from 'sonner';
import Select, { StylesConfig } from 'react-select';

interface Props {
  ticketsData: OrdemdeServicoResponseData;
}

interface Instituicao {
  id: string;
  name: string;
}

interface Tarefa {
  id: string;
  name: string;
}

interface StatusPrioridade {
  id: string;
  name: string;
}

interface Cliente {
  id: string;
  name: string;
}

interface TipodeOrdemdeServico {
  id: string;
  name: string;
}

type SelectOption = { value: string; label: string };

const reportSelectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? '#4E3182' : '#e2e8f0',
    borderWidth: '1.5px',
    borderRadius: '8px',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(78,49,130,0.1)' : 'none',
    backgroundColor: '#f8fafc',
    minHeight: '40px',
    fontSize: '0.85rem',
    fontFamily: '"Poppins", sans-serif',
    cursor: 'pointer',
    '&:hover': { borderColor: '#4E3182' },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4E3182' : state.isFocused ? '#f4f0ff' : '#fff',
    color: state.isSelected ? '#fff' : '#1e293b',
    fontSize: '0.85rem',
    fontFamily: '"Poppins", sans-serif',
    cursor: 'pointer',
  }),
  placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: '0.85rem' }),
  singleValue: (base) => ({ ...base, color: '#1e293b', fontSize: '0.85rem' }),
  clearIndicator: (base) => ({ ...base, color: '#94a3b8', '&:hover': { color: '#4E3182' } }),
  dropdownIndicator: (base) => ({ ...base, color: '#4E3182' }),
  menu: (base) => ({ ...base, borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }),
  menuPortal: (base) => ({ ...base, zIndex: 10000 }),
};

export default function TicketsList({ ticketsData }: Props) {
  const router = useRouter();
  const { openModal } = useGlobalModal();
  const { isOpen } = useContext(ModalContext);

  // Estados de filtro e busca
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchOS, setSearchOS] = useState<string>("");
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tarefa, setTarefa] = useState<Tarefa[]>([]); 
  const [selectedInstituicao, setSelectedInstituicao] = useState<string>("");
  const [tiposOrdem, setTiposOrdem] = useState<TipodeOrdemdeServico[]>([]);
  const [prioridade, setPrioridade] = useState<StatusPrioridade[]>([]);
  const [selectedTipoOrdem, setSelectedTipoOrdem] = useState<string>("");
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>("");
  const [selectedTarefa, setSelectedTarefa] = useState<string[]>([]);

  //Estados de Relatório
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportStatusId, setReportStatusId] = useState("");
  const [reportTipoOSId, setReportTipoOSId] = useState("");
  const [statusList, setStatusList] = useState<StatusPrioridade[]>([]);

  const { total = 0, totalPausada = 0, totalAberta = 0, totalEmDeslocamento = 0, totalEmAndamento = 0, totalConcluida = 0, totalOrdemdeServico = 0, totalTicket = 0, controles = [] } = ticketsData || {};

  // Auto-refresh: modal close, window focus, and 60s polling
  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (prevIsOpen.current && !isOpen) router.refresh();
    prevIsOpen.current = isOpen;
  }, [isOpen, router]);

  useEffect(() => {
    const silentRefresh = () => router.refresh();
    window.addEventListener("focus", silentRefresh);
    const interval = setInterval(silentRefresh, 60_000);
    return () => {
      window.removeEventListener("focus", silentRefresh);
      clearInterval(interval);
    };
  }, [router]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const token = await getCookieClient();
        const [instRes, cliRes, tipoRes, prioRes, tareRes, statusRes] = await Promise.all([
          api.get("/listinstuicao", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/listcliente", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/listtipodeordemdeservico", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/liststatusprioridade", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/liststatustarefa", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/liststatusordemdeservico", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setInstituicoes(instRes.data.instituicoes ?? []);
        setClientes(cliRes.data.controles ?? []);
        setTiposOrdem(tipoRes.data ?? []);
        setPrioridade(prioRes.data ?? []);
        setTarefa(tareRes.data ?? []);
        setStatusList(statusRes.data ?? []);
      } catch (error) {
        console.error("Erro ao carregar filtros:", error);
      }
    };
    fetchFilters();
  }, []);

  const handleDetailOrdemdeServico = (ticket: OrdemdeServicoProps) => {
    openModal('OrdemdeServico', [ticket]);
  };



  const handleAddCardTecnico = () => {
    router.push('/AreadeUsuario/formularioAddTickets');
  };

  const handleAddCardOrdemdeServico = () => {
    router.push('/dashboard/formulariosadd/formularioOrdemdeServico');
  }

  const handleAddCardTicket = () => {
    router.push('/dashboard/formulariosadd/formularioTicket');
  }

  const convertToIso = (dateStr: string) => {
  const [day, month, year] = dateStr.split('/');
  if (!day || !month || !year) return undefined;
  return `${year}-${month}-${day}`;
};

const handleExportClick = async () => {
  setIsExporting(true);
  try {
    await exportOrdemServicoExcel({
      startDate: convertToIso(startDate),
      endDate: convertToIso(endDate),
      tarefa_id: selectedTarefa[0] || undefined,
      cliente_id: selectedCliente || undefined,
      instituicao_id: selectedInstituicao || undefined,
      status_id: reportStatusId || undefined,
      tipoOS_id: reportTipoOSId || undefined,
    });
  } finally {
    setIsExporting(false);
  }
};

const formatDisplayDate = (value: string) => {
return value
  .replace(/\D/g, "") 
  .replace(/(\d{2})(\d)/, "$1/$2") 
  .replace(/(\d{2})(\d)/, "$1/$2") 
  .replace(/(\d{4})(\d)/, "$1"); 
};

  const handleRefresh = () => {
    router.refresh();
    toast.success("Tickets atualizados com sucesso!");
    setSelectedStatus(null);
    setSearchOS("");
    setSelectedInstituicao("");
    setSelectedCliente("");
    setSelectedTipoOrdem("");
    setSelectedPrioridade("");
    setSelectedTarefa([])
  };

  const handleDeleteCardTecnico = async (tecnico_id: string) => {
    try {
      const token = await getCookieClient();
      await api.delete(`/removertecnico/${tecnico_id}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tecnico_id },
      });
      router.refresh();
    } catch (error) {
      console.error("Erro ao deletar técnico:", error);
    }
  };

 const filteredControles = controles.filter(ticket => {
    const isCategoryCard = selectedStatus === 'TICKET' || selectedStatus === 'ORDEM DE SERVICO';

    const matchStatus = (selectedStatus && !isCategoryCard) 
      ? ticket.statusOrdemdeServico?.name === selectedStatus 
      : true;

    const matchCategoryCard = (selectedStatus && isCategoryCard)
      ? ticket.tipodeOrdemdeServico?.name === selectedStatus
      : true;

    const matchOS = searchOS ? ticket.numeroOS?.toString().includes(searchOS) : true;
    const matchInstituicao = !selectedInstituicao 
  ? true 
  : (
      String(ticket.instituicaoUnidade?.id) === String(selectedInstituicao) || 
      String(ticket.user?.instituicaoUnidade?.id) === String(selectedInstituicao) ||
      String(ticket.informacoesSetor?.instituicaoUnidade?.id) === String(selectedInstituicao)
    );
    const matchTipodeOrdemdeServico = selectedTipoOrdem ? ticket.tipodeOrdemdeServico?.id === selectedTipoOrdem : true;
    const matchCliente = selectedCliente 
  ? (
      ticket.cliente?.id === selectedCliente || 
      ticket.user?.cliente?.id === selectedCliente ||
      ticket.informacoesSetor?.cliente?.id === selectedCliente
    )
  : true;
    const matchPrioridade = selectedPrioridade ? ticket.prioridade?.id === selectedPrioridade : true;
    
    
    const matchTarefa = (selectedTarefa && selectedTarefa.length > 0) 
  ? selectedTarefa.includes(String(ticket.tarefa?.id)) 
  : true;

    return matchStatus && matchCategoryCard && matchOS && matchInstituicao && matchCliente && matchTipodeOrdemdeServico && matchPrioridade && matchTarefa;
  });

  return (
    <section>
     
      <header className={styles.headerContainer}>
        <div className={styles.topSection}>
          <div className={styles.titleWrapper}>
            <h1 className={styles.headerTitle}>Tickets Cadastrados</h1>
            <LuRefreshCcw 
              onClick={handleRefresh} 
              className={styles.refreshIcon} 
              title="Sincronizar dados"
            />
            <div className={styles.actionsBar}>
              <button className={styles.btnReport} onClick={() => setIsReportOpen(true)} title="Gerar Relatório">
                <RiFileExcel2Line size={18} />
                Relatório
              </button>
              <button className={styles.btnSecondary} onClick={handleAddCardOrdemdeServico}>
                Nova OS
              </button>
              <button className={styles.btnPrimary} onClick={handleAddCardTicket}>
                Novo Ticket
              </button>
            </div>
          </div>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Pesquisar por número da OS"
              className={styles.searchInput}
              value={searchOS}
              onChange={(e) => setSearchOS(e.target.value)}
            />
          </div>
        </div>
      </header>

{isReportOpen && (
  <div className={styles.reportOverlay} onClick={() => setIsReportOpen(false)}>
    <div className={styles.reportModal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.reportModalHeader}>
        <h2 className={styles.reportModalTitle}>Gerar Relatório de OS</h2>
        <button className={styles.reportModalClose} onClick={() => setIsReportOpen(false)}>✕</button>
      </div>
      <div className={styles.reportModalBody}>
        <div className={styles.reportRowFull}>
          <label className={styles.reportLabel}>Período</label>
          <div className={styles.reportDateGroup}>
            <input
              type="text"
              placeholder="Início (dd/mm/aaaa)"
              value={startDate}
              maxLength={10}
              onChange={(e) => setStartDate(formatDisplayDate(e.target.value))}
              className={styles.reportInput}
            />
            <span className={styles.reportDateSep}>até</span>
            <input
              type="text"
              placeholder="Fim (dd/mm/aaaa)"
              value={endDate}
              maxLength={10}
              onChange={(e) => setEndDate(formatDisplayDate(e.target.value))}
              className={styles.reportInput}
            />
          </div>
        </div>
        <div className={styles.reportRow}>
          <label className={styles.reportLabel}>Tarefa</label>
          <Select<SelectOption>
            options={tarefa.map(t => ({ value: t.id, label: t.name }))}
            value={tarefa.find(t => t.id === selectedTarefa[0]) ? { value: selectedTarefa[0], label: tarefa.find(t => t.id === selectedTarefa[0])!.name } : null}
            onChange={(opt) => setSelectedTarefa(opt ? [opt.value] : [])}
            placeholder="Todas as Tarefas"
            isClearable
            styles={reportSelectStyles}
            menuPortal={typeof window !== 'undefined' ? document.body : undefined}
            noOptionsMessage={() => 'Nenhuma tarefa encontrada'}
          />
        </div>
        <div className={styles.reportRow}>
          <label className={styles.reportLabel}>Instituição</label>
          <Select<SelectOption>
            options={instituicoes.map(i => ({ value: i.id, label: i.name }))}
            value={instituicoes.find(i => i.id === selectedInstituicao) ? { value: selectedInstituicao, label: instituicoes.find(i => i.id === selectedInstituicao)!.name } : null}
            onChange={(opt) => setSelectedInstituicao(opt?.value ?? '')}
            placeholder="Todas as Instituições"
            isClearable
            styles={reportSelectStyles}
            menuPortal={typeof window !== 'undefined' ? document.body : undefined}
            noOptionsMessage={() => 'Nenhuma instituição encontrada'}
          />
        </div>
        <div className={styles.reportRow}>
          <label className={styles.reportLabel}>Cliente</label>
          <Select<SelectOption>
            options={clientes.map(c => ({ value: c.id, label: c.name }))}
            value={clientes.find(c => c.id === selectedCliente) ? { value: selectedCliente, label: clientes.find(c => c.id === selectedCliente)!.name } : null}
            onChange={(opt) => setSelectedCliente(opt?.value ?? '')}
            placeholder="Todos os Clientes"
            isClearable
            styles={reportSelectStyles}
            menuPortal={typeof window !== 'undefined' ? document.body : undefined}
            noOptionsMessage={() => 'Nenhum cliente encontrado'}
          />
        </div>
        <div className={styles.reportRow}>
          <label className={styles.reportLabel}>Status</label>
          <Select<SelectOption>
            options={statusList.map(s => ({ value: s.id, label: s.name }))}
            value={statusList.find(s => s.id === reportStatusId) ? { value: reportStatusId, label: statusList.find(s => s.id === reportStatusId)!.name } : null}
            onChange={(opt) => setReportStatusId(opt?.value ?? '')}
            placeholder="Todos os Status"
            isClearable
            styles={reportSelectStyles}
            menuPortal={typeof window !== 'undefined' ? document.body : undefined}
            noOptionsMessage={() => 'Nenhum status encontrado'}
          />
        </div>
        <div className={styles.reportRowFull}>
          <label className={styles.reportLabel}>Tipo de OS</label>
          <Select<SelectOption>
            options={tiposOrdem.map(t => ({ value: t.id, label: t.name }))}
            value={tiposOrdem.find(t => t.id === reportTipoOSId) ? { value: reportTipoOSId, label: tiposOrdem.find(t => t.id === reportTipoOSId)!.name } : null}
            onChange={(opt) => setReportTipoOSId(opt?.value ?? '')}
            placeholder="Todos os Tipos"
            isClearable
            styles={reportSelectStyles}
            menuPortal={typeof window !== 'undefined' ? document.body : undefined}
            noOptionsMessage={() => 'Nenhum tipo encontrado'}
          />
        </div>
      </div>
      <div className={styles.reportModalFooter}>
        <button className={styles.reportBtnCancel} onClick={() => setIsReportOpen(false)}>
          Cancelar
        </button>
        <button
          onClick={handleExportClick}
          disabled={isExporting}
          className={`${styles.reportBtnExport} ${isExporting ? styles.disabled : ''}`}
        >
          <RiFileExcel2Line size={18} />
          {isExporting ? 'Processando...' : 'Exportar Excel'}
        </button>
      </div>
    </div>
  </div>
)}

      <div className={styles.headerClient}>
        <div className={styles.actions}>

           <h1 className={styles.exportTitle}>FILTRAR OS OU TICKET</h1>

          <select 
            value={selectedTarefa[0] || ""} 
            onChange={(e) => setSelectedTarefa(e.target.value ? [e.target.value] : [])} 
            className={styles.select}
          >
            <option value="">Todas as Tarefas</option>
            {tarefa.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <select value={selectedInstituicao} onChange={(e) => setSelectedInstituicao(e.target.value)} className={styles.select}>
            <option value="">Todas Instituições</option>
            {instituicoes.map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>

          <select value={selectedCliente} onChange={(e) => setSelectedCliente(e.target.value)} className={styles.select}>
            <option value="">Todos Clientes</option>
            {clientes.map(cli => (
              <option key={cli.id} value={cli.id}>{cli.name}</option>
            ))}
          </select>

          <select 
              value={selectedPrioridade} 
              onChange={(e) => setSelectedPrioridade(e.target.value)} 
              className={styles.select}
            >
              <option value="">Prioridade</option>
              {prioridade.map(prio => (
                <option key={prio.id} value={prio.id}>{prio.name}</option>
              ))}
          </select>

          <select 
              value={selectedTipoOrdem} 
              onChange={(e) => setSelectedTipoOrdem(e.target.value)} 
              className={styles.select}
            >
              <option value="">Tipo de Ordem de Serviço</option>
              {tiposOrdem.map(tipo => (
                <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
              ))}
          </select>
        </div> 
      </div>
      
      <div className={styles.cardsContainer}>
        {[
          { label: 'Total', value: total, status: null },
          { label: 'OS Aberta', value: totalAberta, status: 'ABERTA' },
          { label: 'OS Em Deslocamento', value: totalEmDeslocamento, status: 'EM DESLOCAMENTO' },
          { label: 'OS em Andamento', value: totalEmAndamento, status: 'EM ANDAMENTO' },
          { label: 'OS Concluída', value: totalConcluida, status: 'CONCLUIDA' },
          { label: 'OS PAUSADA', value: totalPausada, status: 'PAUSADA' },
          { label: 'TICKET', value: totalTicket, status: 'TICKET' },
          { label: 'ORDEM DE SERVICO', value: totalOrdemdeServico, status: 'ORDEM DE SERVICO' },
        ].map((card) => (
          <div
            key={card.label}
            className={`${styles.card} ${selectedStatus === card.status ? styles.active : ''}`}
            onClick={() => setSelectedStatus(card.status)}
          >
            <p className={styles.cardTitle}>{card.label}</p>
            <strong className={styles.cardNumber}>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.listContainer}>
        {filteredControles.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => handleDetailOrdemdeServico(ticket)}
            className={styles.list}
          >
            <div className={styles.clientDetail}>
              <p className={`${styles.field} ${styles.name}`}><strong>Nome: </strong>{ticket.name}</p>
              <p className={`${styles.field} ${styles.name}`}><strong>Status: </strong>{ticket.statusOrdemdeServico?.name}</p>
              {ticket.numeroOS && <p className={`${styles.field} ${styles.osNumber}`}><strong>Número da OS: </strong>{ticket.numeroOS}</p>}
              <p className={`${styles.field} ${styles.data}`}>
                Data: {ticket.created_at ? new Date(ticket.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
              </p>
              <IoDocumentTextOutline
                onClick={(e) => { e.stopPropagation();}}
                className={styles.iconTrash}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}