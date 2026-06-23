'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import { getCookieClient } from '@/lib/cookieClient';
import { OrdemdeServicoProps } from '@/lib/getOrdemdeServico.type';
import styles from './OSDigital.module.scss';
import { FaPrint } from 'react-icons/fa';
import { MdPictureAsPdf } from 'react-icons/md';
import Image from 'next/image';

type Foto = { id: string; url: string };

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuracao(segundos?: number | null): string {
  if (!segundos) return '00:00:00';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

export default function OSDigitalPage() {
  const { id } = useParams<{ id: string }>();
  const [os, setOs] = useState<OrdemdeServicoProps | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getCookieClient();
        const [osRes, fotosRes] = await Promise.all([
          api.get(`/ordemdeservico/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          api.get(`/foto/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setOs(osRes.data);
        setFotos(fotosRes.data || []);
      } catch (e) {
        console.error('Erro ao buscar OS:', e);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className={styles.loading}>Carregando...</div>;
  if (!os) return <div className={styles.loading}>Ordem de Serviço não encontrada.</div>;

  const clienteNome =
    os.cliente?.name ||
    os.informacoesSetor?.cliente?.name ||
    os.user?.cliente?.name ||
    os.name;

  const clienteEndereco =
    os.instituicaoUnidade?.endereco ||
    os.cliente?.endereco ||
    os.informacoesSetor?.instituicaoUnidade?.endereco ||
    os.informacoesSetor?.cliente?.endereco ||
    '-';

  const clienteTelefone = os.informacoesSetor?.ramal || '-';
  const tecnicoNome = os.tecnico?.name || os.nameTecnico || 'Não atribuído';
  const concluida = os.statusOrdemdeServico?.name === 'CONCLUIDA';

  return (
    <div className={styles.page}>
      {/* TÍTULO */}
      <h1 className={styles.pageTitle}>Ordem de Serviço</h1>

      {/* HEADER EMPRESA */}
      <header className={styles.header}>
        <div className={styles.headerInfo}>
          <strong>ALLTI SERVICE</strong>
          <span><strong>Telefone:</strong> (11) 45024440</span>
          <span><strong>CNPJ:</strong> 31.937.091/0001-10</span>
          <span><strong>Email:</strong> suporte@alltiservice.com</span>
          <span><strong>Endereço:</strong> Rua Braz Cubas, 251, Sala 22, Centro em Mogi das Cruzes – SP</span>
        </div>
        <div className={styles.headerLogo}>
          <Image src="/Logo11.svg" alt="Allti Service" width={80} height={80} className={styles.logo} />
        </div>
      </header>

      {/* INFORMAÇÕES DO CLIENTE */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th colSpan={2} className={styles.tableHeader}>Informações do cliente</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={styles.cell}>
              <strong>Nome do cliente</strong>
              <span className={styles.value}>{clienteNome}</span>
            </td>
            <td className={styles.cell}>
              <strong>CPF/CNPJ</strong>
              <span className={styles.value}>-</span>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className={styles.cell}>
              <strong>Endereço</strong>
              <span className={styles.value}>{clienteEndereco}</span>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className={styles.cell}>
              <strong>Telefone</strong>
              <span className={styles.value}>{clienteTelefone}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* TAREFA */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th colSpan={2} className={styles.tableHeader}>Tarefa #{os.numeroOS}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={styles.cell}>
              <strong>Colaborador Responsável</strong>
              <span className={styles.value}>{tecnicoNome}</span>
            </td>
            <td className={styles.cell}>
              <strong>Data/Hora</strong>
              <span className={styles.value}>{formatDate(os.created_at)}</span>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className={styles.cell}>
              <strong>Tipo de tarefa</strong>
              <span className={styles.value}>{os.tipodeChamado?.name ?? '-'}</span>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className={styles.cell}>
              <strong>Orientação</strong>
              <span className={styles.value}>{os.descricaodoProblemaouSolicitacao || '-'}</span>
            </td>
          </tr>
          <tr>
            <td className={styles.cell}>
              <strong>Inicio</strong>
              <span className={styles.value}>{formatDate(os.startedAt)}</span>
            </td>
            <td className={styles.cell}>
              <strong>Finalização</strong>
              <span className={styles.value}>{formatDate(os.endedAt)}</span>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className={styles.cell}>
              <strong>Duração</strong>
              <span className={styles.value}>{formatDuracao(os.duracao)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ORDEM DE SERVIÇO */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th colSpan={2} className={styles.tableHeaderDark}>ORDEM DE SERVIÇO</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={2} className={styles.cell}>
              <strong>1) Nome do responsável no local (Quem acompanhou).</strong>
              <span className={styles.value}>{os.nomedoContatoaserProcuradonoLocal || '-'}</span>
            </td>
          </tr>

          <tr>
            <td colSpan={2} className={styles.cell}>
              <strong>2) Fotos antes do serviço ser executado.</strong>
              <div className={styles.fotosGrid}>
                {fotos.length > 0
                  ? fotos.map(foto => (
                      <div key={`antes-${foto.id}`} className={styles.fotoBox}>
                        <img src={foto.url} alt="Foto" />
                      </div>
                    ))
                  : (
                    <>
                      <div className={styles.fotoBox} />
                      <div className={styles.fotoBox} />
                    </>
                  )}
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan={2} className={styles.cell}>
              <strong>3) Procedimento realizado. (resolução do atendimento)</strong>
              <span className={styles.value}>{os.solucao || '-'}</span>
            </td>
          </tr>

          <tr>
            <td colSpan={2} className={styles.cell}>
              <strong>4) Serviço concluído?</strong>
              <span className={styles.value}>{concluida ? 'Sim' : 'Não'}</span>
            </td>
          </tr>

          <tr>
            <td colSpan={2} className={styles.cell}>
              <strong>5) Fotos do serviço finalizado.</strong>
              <div className={styles.fotosGrid}>
                {fotos.length > 0
                  ? fotos.map(foto => (
                      <div key={`depois-${foto.id}`} className={styles.fotoBox}>
                        <img src={foto.url} alt="Foto" />
                      </div>
                    ))
                  : (
                    <>
                      <div className={styles.fotoBox} />
                      <div className={styles.fotoBox} />
                    </>
                  )}
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan={2} className={styles.cell}>
              <strong>6) Assinatura do Responsável do Local.</strong>
              <div className={styles.assinaturaBox}>
                {os.bannerassinatura ? (
                  <img src={os.bannerassinatura} alt="Assinatura" className={styles.assinaturaImg} />
                ) : null}
              </div>
              {os.assinante && (
                <p className={styles.assinanteNome}>Assinado por: {os.assinante}</p>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* BOTÕES */}
      <div className={styles.actions}>
        <button className={styles.btnImprimir} onClick={() => window.print()}>
          <FaPrint size={16} /> Imprimir
        </button>
        <button className={styles.btnPdf} onClick={() => window.print()}>
          <MdPictureAsPdf size={18} /> DOWNLOAD DO PDF
        </button>
      </div>
    </div>
  );
}
