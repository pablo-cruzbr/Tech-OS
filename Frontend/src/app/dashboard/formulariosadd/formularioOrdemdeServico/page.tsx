'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import styles from './FormularioOrdemdeServico.module.scss';
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { api } from '@/services/api';
import { getCookieClient } from '@/lib/cookieClient';
import { jwtDecode } from 'jwt-decode';
import { JwtPayload } from '@/lib/JWTpayload.type';
import Select from 'react-select';

export const dynamic = 'force-dynamic';

interface Option {
  value: string;
  label: string;
}

interface TipoDeChamado { id: string; name: string }
interface Status         { id: string; name: string }
interface Tecnico        { id: string; name: string }
interface Instituicao    { id: string; name: string }
interface Cliente        { id: string; name: string }
interface Prioridade     { id: string; name: string }
interface Tarefa         { id: string; name: string }

const toOptions = (list: { id: string; name: string }[]): Option[] =>
  list.map((item) => ({ value: item.id, label: item.name }));

const customSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: '#f8f9fc',
    borderRadius: '12px',
    borderColor: state.isFocused ? '#4E3182' : '#e2e8f0',
    borderWidth: '1.5px',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(78,49,130,0.2)' : 'none',
    minHeight: '46px',
    '&:hover': { borderColor: '#4E3182' },
    transition: 'all 0.2s ease',
  }),
  menu: (base: any) => ({
    ...base,
    zIndex: 9999,
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#4E3182' : state.isFocused ? '#f3effa' : '#fff',
    color: state.isSelected ? '#fff' : '#2d3748',
    cursor: 'pointer',
    padding: '10px 15px',
    fontSize: '13.5px',
    '&:active': { backgroundColor: '#4E3182' },
  }),
  singleValue: (base: any) => ({ ...base, color: '#2d3748', fontSize: '13.5px' }),
  input: (base: any) => ({ ...base, color: '#2d3748', fontSize: '13.5px' }),
  placeholder: (base: any) => ({ ...base, color: '#9ba9b9', fontSize: '13px' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base: any) => ({ ...base, color: '#4E3182', padding: '0 10px' }),
};

export default function FormularioOrdemdeServico() {
  const [tiposDeChamado, setTiposDeChamado] = useState<TipoDeChamado[]>([]);
  const [statusList, setStatusList]         = useState<Status[]>([]);
  const [tecnicoList, setTecnicoList]       = useState<Tecnico[]>([]);
  const [instituicaoList, setInstituicaoList] = useState<Instituicao[]>([]);
  const [clienteList, setClienteList]       = useState<Cliente[]>([]);
  const [prioridadeList, setPrioridadeList] = useState<Prioridade[]>([]);
  const [tarefaList, setTarefaList]         = useState<Tarefa[]>([]);

  const [tipodeChamado, setTipodeChamado]               = useState<Option | null>(null);
  const [prioridade, setPrioridade]                     = useState<Option | null>(null);
  const [tarefa, setTarefa]                             = useState<Option | null>(null);
  const [tecnico, setTecnico]                           = useState<Option | null>(null);
  const [statusOS, setStatusOS]                         = useState<Option | null>(null);
  const [instituicao, setInstituicao]                   = useState<Option | null>(null);
  const [cliente, setCliente]                           = useState<Option | null>(null);

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleBack() {
    router.push('/dashboard/tickets');
  }

  function gerarNumeroOS(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getCookieClient();
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [
          responseChamados,
          responseStatus,
          responseTecnicos,
          responseInstituicoes,
          responseClientes,
          responsePrioridade,
          responseTarefa,
        ] = await Promise.all([
          api.get('/listtipodechamado', config),
          api.get('/liststatusordemdeservico', config),
          api.get('/listtecnico', config),
          api.get('/listinstuicao', config),
          api.get('/listcliente', config),
          api.get('/liststatusprioridade', config),
          api.get('/liststatustarefa', config),
        ]);

        setTiposDeChamado(responseChamados.data ?? []);
        setStatusList(responseStatus.data ?? []);
        setTecnicoList(responseTecnicos.data.controles ?? []);
        setInstituicaoList(responseInstituicoes.data.instituicoes ?? []);
        setClienteList(responseClientes.data.controles ?? []);
        setPrioridadeList(responsePrioridade.data ?? []);
        setTarefaList(responseTarefa.data ?? []);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    }

    fetchData();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const formData = new FormData(event.currentTarget);
    const ORDER_TYPE_ID = "94e32deb-2a02-41f1-9573-b4b5c265e80a";

    const name = formData.get('name')?.toString().trim();
    const descricaodoProblemaouSolicitacao = formData.get('descricaodoProblemaouSolicitacao')?.toString().trim();
    const nomedoContatoaserProcuradonoLocal = formData.get('nomedoContatoaserProcuradonoLocal')?.toString().trim() || null;

    if (!name || !tipodeChamado || !descricaodoProblemaouSolicitacao) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    try {
      const token = await getCookieClient();
      if (!token) {
        alert('Token de autenticação não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }

      const decoded = jwtDecode<JwtPayload>(token);
      const user_id = decoded.sub;
      const numeroOS = gerarNumeroOS();

      const payload: any = {
        numeroOS,
        name,
        tipodeChamado_id: tipodeChamado.value,
        descricaodoProblemaouSolicitacao,
        tipodeOrdemdeServico_id: ORDER_TYPE_ID,
        nomedoContatoaserProcuradonoLocal,
        user_id,
        prioridade_id:            prioridade?.value   || null,
        tarefa_id:                tarefa?.value        || null,
        tecnico_id:               tecnico?.value       || null,
        statusOrdemdeServico_id:  statusOS?.value      || null,
        instituicaoUnidade_id:    instituicao?.value   || null,
        cliente_id:               cliente?.value       || null,
      };

      await api.post('/ordemdeservico', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      router.refresh();
      router.push('/dashboard/tickets');
    } catch (err) {
      console.error('Erro ao enviar ordem de serviço:', err);
      alert('Erro ao enviar. Verifique os campos e tente novamente.');
      setLoading(false);
    }
  }

  return (
    <section className={styles.pageWrapper}>
      <div className={styles.headerClient}>
        <h1 className={styles.titleClient}>FORMULÁRIO ORDEM DE SERVIÇO</h1>
        <button className={styles.button} onClick={handleBack}>
          <IoArrowBackCircleOutline size={25} color="#ffff" onClick={handleBack} style={{ cursor: 'pointer' }} />
          Voltar
        </button>
      </div>

      <div className={styles.container}>
        <section className={styles.login}>
          <form onSubmit={handleSubmit}>

            {/* ── Informações Gerais ── */}
            <p className={styles.sectionTitle}>Informações Gerais</p>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Nome do Cliente <span>*</span></label>
              <input
                type="text"
                required
                name="name"
                placeholder="Digite o nome do cliente"
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Tipo de Chamado <span>*</span></label>
              <Select
                instanceId="tipochamado-select"
                placeholder="Selecione o tipo de chamado..."
                isSearchable
                options={toOptions(tiposDeChamado)}
                value={tipodeChamado}
                onChange={(opt) => setTipodeChamado(opt)}
                styles={customSelectStyles}
              />
            </div>

            <div className={styles.fieldGroupFull}>
              <label className={styles.fieldLabel}>Descrição do Problema / Solicitação <span>*</span></label>
              <div className={`${styles.input} ${styles.textAreaContainer}`}>
                <textarea
                  name="descricaodoProblemaouSolicitacao"
                  placeholder="Descreva o problema ou solicitação..."
                  required
                  className={styles.textarea}
                />
              </div>
            </div>

            <div className={styles.fieldGroupFull}>
              <label className={styles.fieldLabel}>Nome do Contato no Local</label>
              <input
                type="text"
                name="nomedoContatoaserProcuradonoLocal"
                placeholder="Nome do contato (opcional)"
                className={styles.input}
              />
            </div>

            {/* ── Atribuição ── */}
            <p className={styles.sectionTitle}>Atribuição</p>

            <div className={styles.grid2}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Prioridade</label>
                <Select
                  instanceId="prioridade-select"
                  placeholder="Selecione..."
                  isSearchable
                  isClearable
                  options={toOptions(prioridadeList)}
                  value={prioridade}
                  onChange={(opt) => setPrioridade(opt)}
                  styles={customSelectStyles}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Tarefa</label>
                <Select
                  instanceId="tarefa-select"
                  placeholder="Selecione..."
                  isSearchable
                  isClearable
                  options={toOptions(tarefaList)}
                  value={tarefa}
                  onChange={(opt) => setTarefa(opt)}
                  styles={customSelectStyles}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Técnico</label>
                <Select
                  instanceId="tecnico-select"
                  placeholder="Selecione..."
                  isSearchable
                  isClearable
                  options={toOptions(tecnicoList)}
                  value={tecnico}
                  onChange={(opt) => setTecnico(opt)}
                  styles={customSelectStyles}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Status da OS</label>
                <Select
                  instanceId="status-select"
                  placeholder="Selecione..."
                  isSearchable
                  isClearable
                  options={toOptions(statusList)}
                  value={statusOS}
                  onChange={(opt) => setStatusOS(opt)}
                  styles={customSelectStyles}
                />
              </div>
            </div>

            {/* ── Localização & Cliente ── */}
            <p className={styles.sectionTitle}>Localização & Cliente</p>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Instituição / Unidade</label>
              <Select
                instanceId="instituicao-select"
                placeholder="Pesquise e selecione a unidade..."
                isSearchable
                isClearable
                options={toOptions(instituicaoList)}
                value={instituicao}
                onChange={(opt) => setInstituicao(opt)}
                styles={customSelectStyles}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Cliente</label>
              <Select
                instanceId="cliente-select"
                placeholder="Selecione o cliente (opcional)..."
                isSearchable
                isClearable
                options={toOptions(clienteList)}
                value={cliente}
                onChange={(opt) => setCliente(opt)}
                styles={customSelectStyles}
              />
            </div>

            <div className={styles.buttonRow}>
              <button type="button" className={`${styles.button} ${styles.buttonOutline}`} onClick={handleBack}>
                Cancelar
              </button>
              <button className={styles.button} type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Concluir"}
              </button>
            </div>

          </form>
        </section>
      </div>
    </section>
  );
}
