"use client";

import { useEffect, useState } from "react";
import styles from "./styles.module.scss";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { SiGoogledocs } from "react-icons/si";
import { FaUserPlus } from "react-icons/fa6";
import { BsImages } from "react-icons/bs";
import { FaSignature, FaFileAlt } from "react-icons/fa";
import { FaComputer } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { useGlobalModal } from "@/provider/GlobalModalProvider";
import { OrdemdeServicoProps } from "@/lib/getOrdemdeServico.type";
import { UsuariosProps } from '@/lib/getUsuario.type';
import EditCardOrdemdeServico from "./EditCardOrdemdeServico";
import ViewCardFoto from "./ViewCardFoto";
import DetailTecnico from "./DetailTecnico";
import Assinatura from "./Assinatura";
import { api } from "@/services/api";
import { getCookieClient } from "@/lib/cookieClient";

interface ModalOrdemdeServicoProps {
  data: OrdemdeServicoProps[];
}

export function ModalOrdemdeServico({ data }: ModalOrdemdeServicoProps) {
  const { closeModal, modalData, modalType, isOpen } = useGlobalModal();
  const OrdemdeServico: OrdemdeServicoProps | undefined = modalData?.[0] || modalData;
  const [localOS, setLocalOS] = useState<OrdemdeServicoProps | undefined>(OrdemdeServico);
  const [usuario, setUsuario] = useState<UsuariosProps | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFotos, setIsFotos] = useState(false);
  const [isDetailTecnico, setDetailTecnico] = useState(false);
  const [isAssinatura, setAssinatura] = useState(false)

  const router = useRouter();

  useEffect(() => {
    setLocalOS(OrdemdeServico);
  }, [OrdemdeServico?.id]);

  async function handleSaved() {
    if (localOS?.id) {
      try {
        const token = await getCookieClient();
        const res = await api.get(`/ordemdeservico/${localOS.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLocalOS(res.data);
      } catch (e) {
        console.error('Erro ao re-buscar OS:', e);
      }
    }
    setIsEditing(false);
    router.refresh();
  }

  useEffect(() => {
    if (modalType === "OrdemdeServico" && !OrdemdeServico) {
      closeModal();
    }
  }, [OrdemdeServico, modalType, closeModal]);

  if (modalType !== "OrdemdeServico" || !isOpen || !localOS) return null;

   async function handleAddCard() {
    router.push('/dashboard/formulariosadd/formularioMaquinas');

    const url = '/dashboard/formulariosadd/formularioMaquinas';
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  }

  return (
    <div className={styles.dialogContainer} open>
      <section className={styles.dialogContent}>
        <button onClick={closeModal} className={styles.dialogBack}>
          <IoIosCloseCircleOutline size={36} color="#4E3182" />
        </button>

        <h2>Detalhes da Ordem de Serviço</h2>

        {isFotos && (
          <ViewCardFoto
            ordemdeServico={localOS}
            onClose={() => setIsFotos(false)}
          />
        )}

        {isAssinatura && (
          <Assinatura
            ordemdeServico={localOS}
            onClose={() => setAssinatura(false)}
          />
        )}

        {isEditing && (
          <EditCardOrdemdeServico
            ordemdeServico={localOS}
            onClose={() => setIsEditing(false)}
            onSave={handleSaved}
          />
        )}

        {isDetailTecnico && (
          <DetailTecnico
            ordemdeServico={localOS}
            onClose={() => setDetailTecnico(false)}
          />
        )}

        {!isFotos && !isEditing && !isDetailTecnico && !isAssinatura && (
          <>
            <p className={styles.sectionTitle}>Dados do Usuário</p>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Número da OS e Tipo:</label>
                <span>{localOS.numeroOS} - {localOS.tipodeOrdemdeServico?.name ?? "Tipo de Ordem de Serviço Não Informado"}</span>
              </div>
   
              <div className={styles.infoItem}>
                <label>Quem abriu a OS: </label>
                <span>{localOS.name ?? "Nome de Usuário Não Informado no Formulário"}</span>

                <label>Nome de cadastro do usuário: </label>
                <span>{localOS.user.name}</span>
               
              </div>
            </div>

            <p className={styles.sectionTitle}>Problema: </p>
               <p>
                  {localOS.descricaodoProblemaouSolicitacao || "Não informada"}
            </p>

           <p className={styles.sectionTitle}>Dados de Localização</p>
            <div className={styles.infoItem}>

              {localOS.instituicaoUnidade || localOS.cliente ? (
                <div className={styles.locationBlock} style={{ marginBottom: '12px' }}>
                  <strong style={{ display: 'block' }}>
                    {localOS.instituicaoUnidade?.name || localOS.cliente?.name}
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: '#666' }}>
                    {localOS.instituicaoUnidade?.endereco || localOS.cliente?.endereco || "Endereço não disponível"}
                  </span>
                </div>
              ) : (localOS.user?.instituicaoUnidade || localOS.user?.cliente) && (
                <div className={styles.locationBlock} style={{ marginBottom: '12px' }}>
                  <label>Local de Abertura (Usuário):</label>
                  <strong style={{ display: 'block' }}>
                    {localOS.user?.instituicaoUnidade?.name || localOS.user?.cliente?.name}
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.9rem', color: '#666' }}>
                    {localOS.user?.instituicaoUnidade?.endereco || localOS.user?.cliente?.endereco || "Endereço não disponível"}
                  </span>
                </div>
              )}

              {((localOS.user?.instituicaoUnidade || localOS.user?.cliente) && 
                (localOS.instituicaoUnidade || localOS.cliente) &&
                (localOS.user?.instituicaoUnidade?.name !== localOS.instituicaoUnidade?.name)) && (
                <div className={styles.locationBlock} style={{ borderTop: '1px solid #eee', paddingTop: '8px' }}>
                  <label>Origem da abertura (Usuário):</label>
                  <span style={{ display: 'block', fontSize: '0.85rem' }}>
                    {localOS.user?.instituicaoUnidade?.name || localOS.user?.cliente?.name}
                  </span>
                </div>
              )}

              {!(localOS.instituicaoUnidade || localOS.cliente || localOS.user?.instituicaoUnidade || localOS.user?.cliente) && (
                <span>Localização não informada</span>
              )}
            </div>

            <p className={styles.sectionTitle}>Dados da Solicitação</p>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <label>Tipo de Serviço:</label>
                <span>{localOS.tipodeChamado.name}</span>
              </div>

             
              <div className={styles.infoItem}>
                <label>Pessoa a ser procurada no local:</label>
                <span>{localOS.nomedoContatoaserProcuradonoLocal}</span>
              </div>

              <div className={styles.infoItem}>
                <label>Status da OS:</label>
                <span>{localOS.statusOrdemdeServico?.name ?? "-"}</span>
              </div>

              <div className={styles.infoItem}>
                <label>Equipamento:</label>
                {localOS.equipamento ? (
                  <span>{localOS.equipamento.name} — Patrimônio: {localOS.equipamento.patrimonio}</span>
                ) : localOS.patrimoniodoequipamento ? (
                  <span>Patrimônio: {localOS.patrimoniodoequipamento}</span>
                ) : (
                  <span>Não informado</span>
                )}
              </div>


              <div className={styles.infoItem}>
                <label>Técnico Responsável:</label>
                <span>{localOS.tecnico?.name ?? "Não informado"}</span>
              </div>

              <div className={styles.infoItem}>
                <label>Tarefa:</label>
                  <span>{localOS.tarefa?.name ?? "Não informado"}</span>
              </div>

        
          
              <div className={styles.infoItem}>
                <label>Data de Criação:</label>
                <span>
                  {localOS.created_at
                    ? new Date(localOS.created_at).toLocaleDateString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : "-"}
                </span>
              </div>

            </div>
            

            {/* BOTÕES */}
            <div className={styles.areaButton}>


              <button className={styles.buttonBuy} onClick={() => setAssinatura(true)}>
                <FaSignature size={20} />
              </button>
              
               <button className={styles.buttonBuy} onClick={() => setIsFotos(true)}>
                <BsImages size={18} />
                Ver Fotos
              </button>

              <button className={styles.buttonBuy} onClick={() => setDetailTecnico(true)}>
                <SiGoogledocs  size={18}/>               
              </button>

              <button className={styles.buttonBuy} onClick={() => setIsEditing(true)}>
                <FaUserPlus size={18} />
                Atribuir OS a um Técnico ou Alterar Status
              </button>

              <button className={styles.buttonBuy} onClick={handleAddCard}>
                <FaComputer size={21} />
                Cadastrar nova Máquina
              </button>

              <button
                className={styles.buttonBuy}
                onClick={() => window.open(`/os-digital/${localOS.id}`, '_blank')}
              >
                <FaFileAlt size={18} />
                Ordem de Serviço Digital
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
