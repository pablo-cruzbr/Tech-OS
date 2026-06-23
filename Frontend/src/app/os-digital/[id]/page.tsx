'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import { getCookieClient } from '@/lib/cookieClient';
import { OrdemdeServicoProps } from '@/lib/getOrdemdeServico.type';
import styles from './OSDigital.module.scss';
import { FaPrint } from 'react-icons/fa';
import { MdPictureAsPdf } from 'react-icons/md';

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
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  async function handleDownloadPDF() {
    if (!contentRef.current || !os) return;
    setGeneratingPDF(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(contentRef.current, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        onclone: (doc) => {
          const imgs = doc.querySelectorAll('img');
          imgs.forEach((img) => {
            img.crossOrigin = 'anonymous';
          });
        },
      });

      const MAX_BYTES = 4 * 1024 * 1024;

      const buildPDF = (imgData: string) => {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position -= pageHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        return pdf;
      };

      let blob: Blob | null = null;
      for (const quality of [0.8, 0.6, 0.4]) {
        const imgData = canvas.toDataURL('image/jpeg', quality);
        const pdf = buildPDF(imgData);
        blob = pdf.output('blob');
        if (blob.size <= MAX_BYTES) break;
      }

      const url = URL.createObjectURL(blob!);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OS-${os.numeroOS}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
    } finally {
      setGeneratingPDF(false);
    }
  }

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

  const clienteCNPJ = os.informacoesSetor?.cliente?.cnpj || '-';
  const clienteTelefone = os.informacoesSetor?.ramal || '-';
  const tecnicoNome = os.tecnico?.name || os.nameTecnico || 'Não atribuído';
  const concluida = os.statusOrdemdeServico?.name === 'CONCLUIDA';

  return (
    <div className={styles.wrapper}>
      {/* Conteúdo que será capturado pelo jsPDF */}
      <div className={styles.page} ref={contentRef}>

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logoAlltiService.JPG"
              alt="Allti Service"
              width={140}
              height={140}
              className={styles.logo}
              crossOrigin="anonymous"
            />
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
                <span className={styles.value}>{clienteCNPJ}</span>
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={foto.url} alt="Foto" crossOrigin="anonymous" />
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
                {os.atividades && os.atividades.length > 0 && (
                  <div className={styles.atividadesBox}>
                    <strong className={styles.atividadesTitle}>Atividades realizadas:</strong>
                    {[...new Set(os.atividades.map(a => a.atividadePadrao.categoria))].sort().map(cat => (
                      <div key={cat}>
                        <span className={styles.atividadeCategoria}>{cat}</span>
                        <ul className={styles.atividadesList}>
                          {os.atividades!
                            .filter(a => a.atividadePadrao.categoria === cat)
                            .map(a => (
                              <li key={a.id}>{a.atividadePadrao.descricao}</li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={foto.url} alt="Foto" crossOrigin="anonymous" />
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={os.bannerassinatura}
                      alt="Assinatura"
                      className={styles.assinaturaImg}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <span className={styles.semAssinatura}>Sem assinatura</span>
                  )}
                </div>
                {os.assinante && (
                  <p className={styles.assinanteNome}>Assinado por: {os.assinante}</p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* BOTÕES — fora do contentRef, não entram no PDF */}
      <div className={styles.actions}>
        <button className={styles.btnImprimir} onClick={() => window.print()}>
          <FaPrint size={16} /> Imprimir
        </button>
        <button
          className={styles.btnPdf}
          onClick={handleDownloadPDF}
          disabled={generatingPDF}
        >
          <MdPictureAsPdf size={18} />
          {generatingPDF ? 'Gerando PDF...' : 'DOWNLOAD DO PDF'}
        </button>
      </div>
    </div>
  );
}
