// src/app/AreadeUsuario/formularioAddTickets/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { getCookieClient } from '@/lib/cookieClient';
import styles from '../formularioAddTickets.module.scss'
import { FaClipboardList, FaTimes } from 'react-icons/fa';
import { JwtPayload } from '@/lib/JWTpayload.type';
import { UsuariosProps } from '@/lib/getUsuario.type';
import { jwtDecode } from 'jwt-decode';

interface TipoDeChamado {
  id: string;
  name: string;
}

interface TipoDeOrdemdeServico {
  id: string;
  name: string;
}

export default function FormularioAddTickets() {
  const [tiposDeChamado, setTiposDeChamado] = useState<TipoDeChamado[]>([]);
  const [tipodeOrdemdeServico, setTipodeOrdemdeServico] = useState<TipoDeOrdemdeServico[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuario, setUsuario] = useState<UsuariosProps | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // Função para gerar número de OS de 5 dígitos
  function gerarNumeroOS(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  useEffect(() => {
    async function fetchTiposDeChamado() {
      try {
        const token = await getCookieClient();
        const response = await api.get('/listtipodechamado', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
        setTiposDeChamado(response.data);
      } catch (error) {
        console.error('Erro ao buscar tipos de chamado:', error);
      }
    }
    fetchTiposDeChamado();
  }, []);

   useEffect(() => {
    async function fetchTiposDeOrdemdeServico() {
      try {
         const token = await getCookieClient();
        const response = await api.get('/listtipodeordemdeservico', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTipodeOrdemdeServico(response.data);
      } catch (error) {
        console.error('Erro ao buscar tipos de chamado:', error);
      }
    }
    fetchTiposDeOrdemdeServico();
  }, []);

  useEffect(() => {
    async function fetchUserData() {
      const token = await getCookieClient();
      if (!token) return;

      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const user_id = decoded.sub;

        const response = await api.get('/users/detail', {
          params: { user_id },
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsuario(response.data as UsuariosProps);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário autenticado:', error);
      }
    }

    fetchUserData();
  }, []);

 async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (loading) return;

  const formData = new FormData(event.currentTarget);
  const name = formData.get('name')?.toString().trim();
  const tipodeChamado_id = formData.get('tipodeChamado_id')?.toString().trim();
  const tipodeOrdemdeServico_id = formData.get('tipodeOrdemdeServico_id')?.toString().trim();
  const descricaodoProblemaouSolicitacao = formData.get('descricaodoProblemaouSolicitacao')?.toString().trim();
  const nomedoContatoaserProcuradonoLocal =
    formData.get('nomedoContatoaserProcuradonoLocal')?.toString().trim() || null;

  if (!name || !tipodeChamado_id || !descricaodoProblemaouSolicitacao) {
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
      tipodeChamado_id,
      descricaodoProblemaouSolicitacao,
      nomedoContatoaserProcuradonoLocal,
      user_id,
    };

    if (usuario?.cliente?.id) payload.cliente_id = usuario.cliente.id;
    if (usuario?.instituicaoUnidade?.id) payload.instituicaoUnidade_id = usuario.instituicaoUnidade.id;
    if (usuario?.tecnico?.id) payload.tecnico_id = usuario.tecnico.id;

    await api.post('/ordemdeservico', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    router.push('/AreadeUsuario/formularioenviado');
  } catch (err) {
    console.error('Erro ao enviar ordem de serviço:', err);
    alert('Erro ao enviar. Verifique os campos e tente novamente.');
    setLoading(false);
  }
}

  return (
  <div className={styles.container}>
    <div className={styles.panelsContainer}>
      
      {/* PAINEL ESQUERDO (ROXO) - Focado em Info do Usuário */}
      <div className={`${styles.panel} ${styles.leftPanel}`}>
        <div className={styles.content}>
          <h3>Bem Vindo ao AlltiControl</h3>
          <p>
            Gerencie suas solicitações de forma rápida <br /> 
            e integrada ao nosso sistema.
          </p>

          {usuario && (
            <div className={styles.usuarioBox}>
              <h3>Usuário Logado</h3>
              <div className={styles.usuarioInfo}>
                <p><strong>Nome:</strong> {usuario.name}</p>
                <p><strong>Setor:</strong> {usuario.setor?.name || "Desenvolvedor Fullstack"}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PAINEL DIREITO (BRANCO) - Focado na Ação de Nova Ordem */}
      <div className={`${styles.panel} ${styles.rightPanel}`}>
        <div className={styles.content}>
          <h3 style={{ color: '#444' }}>Abra sua Ordem de Serviço</h3>
          <p style={{ color: '#666' }}>
            Clique no botão abaixo para iniciar <br /> o preenchimento da sua solicitação.
          </p>
          
          <button 
            className={`${styles.btn} ${styles.solid}`} 
            onClick={() => setIsModalOpen(true)}
          >
            Nova Ordem
          </button>
        </div>
      </div>
    </div>

    {/* MODAL DE FORMULÁRIO */}
    {isModalOpen && (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <button className={styles.closeModal} onClick={() => setIsModalOpen(false)}>
            <FaTimes />
          </button>
          
          <div className={styles.signinSignup}>
            <form onSubmit={handleSubmit} className={styles.signInForm}>
              <h2 className={styles.title}>Nova Ordem de Serviço</h2>

              <p>Nome do Cliente / Solicitante</p>
              <div className={styles.inputField}>
                <FaClipboardList className={styles.icon} />
                <input type="text" name="name" placeholder="Nome completo" required />
              </div>

              <p>Tipo de Ordem de Serviço</p>
              <div className={styles.inputField}>
                <FaClipboardList className={styles.icon} />
                <select name="tipodeOrdemdeServico_id" required className={styles.select}>
                  <option value="" disabled hidden>Selecione o Tipo de OS</option>
                  {tipodeOrdemdeServico.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
                  ))}
                </select>
              </div>

              <p>Tipo de Chamado</p>
              <div className={styles.inputField}>
                <FaClipboardList className={styles.icon} />
                <select name="tipodeChamado_id" required className={styles.select}>
                  <option value="" disabled hidden>Selecione o Tipo de Chamado</option>
                  {tiposDeChamado.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>{tipo.name}</option>
                  ))}
                </select>
              </div>

              <p>Descrição Detalhada</p>
              <div className={`${styles.inputField} ${styles.textArea}`}>
                <FaClipboardList className={styles.icon} />
                <textarea
                  name="descricaodoProblemaouSolicitacao"
                  placeholder="Descreva o problema detalhadamente..."
                  required
                />
              </div>

              <p>Contato no Local (Opcional)</p>
              <div className={styles.inputField}>
                <FaClipboardList className={styles.icon} />
                <input
                  type="text"
                  name="nomedoContatoaserProcuradonoLocal"
                  placeholder="Nome de quem procurar no local"
                />
              </div>

              <p>Patrimônio do Equipamento</p>
              <div className={styles.inputField}>
                <FaClipboardList className={styles.icon} />
                <input
                  type="text"
                  name="patrimonio" 
                  placeholder="Ex: 56971"
                />
              </div>

              <button type="submit" className={`${styles.btn} ${styles.solid}`} disabled={loading}>
                {loading ? <div className={styles.spinner} /> : "Enviar Ordem"}
              </button>
            </form>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
