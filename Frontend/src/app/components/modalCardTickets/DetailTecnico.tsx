"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import styles from "../modalCardCompras/editForm.module.scss";
import { OrdemdeServicoProps } from "@/lib/getOrdemdeServico.type";
import { getCookieClient } from "@/lib/cookieClient";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { FaRegSave } from "react-icons/fa";

type Status = { id: string; name: string };
type Tecnicos = { id: string; name: string };
type AtividadePadrao = {id: string; descricao: string; categoria: string};

type FormState = {
  tecnico_id: string;
  statusOrdemdeServico_id: string;
};

type Props = {
  ordemdeServico: OrdemdeServicoProps;
  onClose: () => void;
};

type TimeOS = {
  startedAt?: string | null; 
  endedAt?: string | null;    
  duracao?: number;
}

export default function DetailTecnico({ ordemdeServico, onClose }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    tecnico_id: ordemdeServico?.tecnico?.id || "",
    statusOrdemdeServico_id: ordemdeServico?.statusOrdemdeServico?.id || "",
  });
 const [timeOS, setTimeOs] = useState<TimeOS >({});
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [tecnicoList, setTecnicoList] = useState<Tecnicos[]>([]);
  const [atividadeList, setAtividadeList] = useState<AtividadePadrao[]>([])

  const handleSubmit = async () => {
    try {
      const token = await getCookieClient();

      await api.patch(
        `/ordemdeservico/update/${ordemdeServico.id}`,
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Ordem de serviço atualizada com sucesso!");
      onClose();
      router.refresh();
    } catch (err: any) {
      console.error("Erro ao atualizar:", err?.response?.data ?? err);
      alert("Erro ao atualizar os dados.");
    }
  };

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const token = await getCookieClient();
        const [tecnicos] = await Promise.all([
          api.get("/listtecnico", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const [status] = await Promise.all([
          api.get("/liststatusordemdeservico", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const [AtividadePadrao] = await Promise.all([
          api.get("/listatividade", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setTecnicoList(tecnicos.data.controles);
        setStatusList(status.data);
        setAtividadeList(AtividadePadrao.data)
      } catch (error) {
        console.error("Erro ao buscar listas:", error);
      }
    };
    fetchLists();
  }, []);
  
 useEffect(() => {
  const fetchTime = async (ordemId: string) => {
    try {
      const token = await getCookieClient();
      const { data } = await api.get<TimeOS>(`/ordemdeservico/tempo/${ordemId}`, { 
        headers: { Authorization: `Bearer ${token}` }
      });

      setTimeOs(data);
    } catch (error) {
      console.error("Erro ao buscar tempo da OS:", error);
    }
  };

  if (ordemdeServico.id) {
    fetchTime(ordemdeServico.id);
  }
}, [ordemdeServico.id]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

const formatSecondsToHHMMSS = (secs?: number | null): string => {
  if (secs == null || Number.isNaN(Number(secs))) return "Sem duração";

  const total = Math.floor(Number(secs)); 
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

  return (
    <div className={styles.editForm}>
      <h3 className={styles.detailTitle}>
        <HiOutlinePencilSquare className={styles.icon} />
        Detalhes Técnicos
      </h3>

    <div className={styles.detailContent}>
  {/* Descrição do Problema - Essencial aparecer aqui também */}
  <p>
    <strong>Descrição do Problema:</strong> {ordemdeServico.descricaodoProblemaouSolicitacao || "Não informada"}
  </p>

   <p>
    <strong>Nº do Patrimônio:</strong> {ordemdeServico.patrimoniodoequipamento || "Não informada"}
  </p>

  <p>
    <strong>Solução Técnica:</strong> {ordemdeServico.solucao || "Sem Detalhes Técnicos"}
  </p>

  {/* No seu FormularioTickets você não tem um campo 'diagnostico'. 
      Se quiser usar esse campo, precisará adicionar um textarea no formulário. */}
  <p>
    <strong>Diagnóstico:</strong> {ordemdeServico.diagnostico || "Sem diagnóstico registrado"}
  </p>

  <p>
    <strong>Técnico Responsável:</strong> {ordemdeServico.tecnico?.name || "Não atribuído"}
  </p>

  <p>
    <strong>Quem Documentou:</strong> {ordemdeServico.user?.name || "Sem nome disponível"}
  </p>

        <p>========================================================</p>

        {ordemdeServico.informacoesSetor?.cliente?.name ? (
                  <p className={`${styles.field} ${styles.name}`}>
                    <strong>Local:</strong> {ordemdeServico.informacoesSetor.cliente.name}
                  </p>
                ) : ordemdeServico.informacoesSetor?.instituicaoUnidade?.name ? (
                  <p className={`${styles.field} ${styles.name}`}>
                    <strong>Local:</strong> {ordemdeServico.informacoesSetor.instituicaoUnidade.name}
                  </p>
                ) : null}

         {ordemdeServico.informacoesSetor ? (
          <div>
            <p>
              <strong>Setor:</strong> {ordemdeServico.informacoesSetor.setor?.name || "Sem setor"}
            </p>
            <p>
              <strong>Usuário:</strong> {ordemdeServico.informacoesSetor.usuario || "Sem usuário"}
            </p>
            <p>
              <strong>Ramal:</strong> {ordemdeServico.informacoesSetor.ramal || "Sem ramal"}
            </p>
            <p>
              <strong>Andar:</strong> {ordemdeServico.informacoesSetor.andar || "Sem andar"}
            </p>
          </div>
        ) : (
          <p>Sem informações do setor</p>
        )}

      <p>========================================================</p>
      <p>Dados definidos pelo Aplicativo:</p>
      <p>
        <strong>Horário de Início:</strong>{" "}
        {timeOS?.startedAt
          ? new Date(timeOS.startedAt).toLocaleTimeString("pt-BR", {
              timeZone: "America/Sao_Paulo",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Sem horário"}
      </p>

      <p>
        <strong>Horário de Término:</strong>{" "}
        {timeOS?.endedAt
          ? new Date(timeOS.endedAt).toLocaleTimeString("pt-BR", {
              timeZone: "America/Sao_Paulo", 
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Sem horário"}
      </p>

      <p>
        <strong>Duração:</strong>{" "}
        {timeOS?.duracao !== undefined && timeOS?.duracao !== null 
          ? formatSecondsToHHMMSS(Math.abs(timeOS.duracao)) 
          : "Sem duração"}
      </p>

        <p>========================================================</p>
        <strong>Atividades Realizadas:</strong>

        <ul className={styles.atividadesList}>
          {ordemdeServico.atividades && ordemdeServico.atividades.length > 0 ? (
            ordemdeServico.atividades.map((item) => (
              <li key={item.id} className={styles.atividadeItem}>
               {item.atividadePadrao?.descricao}
              </li>
            ))
          ) : (
            <p>Nenhuma atividade registrada.</p>
          )}
        </ul>
     
      <div className={styles.buttonArea}>
        <button type="button" className={styles.cancelButton} onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
</div>
  );
}
