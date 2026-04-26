"use client";

import { toast } from 'sonner';
import styles from "./signup_insituicao.module.scss";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCookieClient } from "@/lib/cookieClient";
import Select from 'react-select'; 

export const dynamic = 'force-dynamic';

interface Option {
  value: string;
  label: string;
}

interface InstituicaoUnidadeProps {
  id: string;
  name: string;
}

interface SetorProps {
  id: string;
  name: string;
}

export default function Signup() {
  const router = useRouter();
  
  const [instituicoes, setInstituicoes] = useState<Option[]>([]);
  const [setores, setSetores] = useState<Option[]>([]);
  
  const [selectedInstituicao, setSelectedInstituicao] = useState<Option | null>(null);
  const [selectedSetor, setSelectedSetor] = useState<Option | null>(null);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResources() {
      try {
        setLoading(true);
        const token = typeof getCookieClient === 'function' ? getCookieClient() : null;
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

        const [resInstituicoes, resSetores] = await Promise.all([
          api.get("/listinstuicao", config),
          api.get("/listsetores", config)
        ]);

        const instData = resInstituicoes.data?.instituicoes || resInstituicoes.data || [];
        setInstituicoes(instData.map((item: InstituicaoUnidadeProps) => ({
          value: item.id,
          label: item.name
        })));

        const setorData = resSetores.data || [];
        setSetores(setorData.map((item: SetorProps) => ({
          value: item.id,
          label: item.name
        })));

      } catch (err: any) {
        setError("Erro ao carregar dados.");
        toast.error("Falha ao carregar listas.");
      } finally {
        setLoading(false);
      }
    }
    loadResources();
  }, []);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    if (!name || !email || !password || !selectedInstituicao || !selectedSetor) {
      toast.warning("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await api.post("/users", {
        name,
        email,
        password,
        instituicaoUnidade_id: selectedInstituicao.value,
        setor_id: selectedSetor.value,
      });

      toast.success('Usuário cadastrado com sucesso!');
      formElement.reset();
      
      setSelectedInstituicao(null);
      setSelectedSetor(null);

    } catch (err: any) {
      const message = err.response?.data?.error || "Erro ao cadastrar usuário.";
      toast.error(message);
      setError(message);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.conteiner}>
        <section className={styles.login}>
          <h1 className={styles.textHeader}>Novo Usuário</h1>
          
          <form onSubmit={handleRegister}>
            <input
              type="text"
              name="name"
              placeholder="Nome completo"
              required
              className={styles.input}
            />

            <input
              type="email"
              name="email"
              placeholder="E-mail"
              required
              className={styles.input}
            />

            <input
              type="password"
              name="password"
              placeholder="Senha"
              required
              className={styles.input}
            />

            <div className={styles.selectWrapper}>
              <p className={styles.text}>Instituição / Unidade</p>
              <Select
                options={instituicoes}
                value={selectedInstituicao}
                onChange={(opt) => setSelectedInstituicao(opt)}
                placeholder="Selecione a unidade..."
                isLoading={loading}
                className={styles.reactSelect}
                isClearable
                noOptionsMessage={() => "Nenhuma instituição encontrada"}
              />
            </div>

            <div className={styles.selectWrapper}>
              <p className={styles.text}>Setor de Atendimento</p>
              <Select
                options={setores}
                value={selectedSetor}
                onChange={(opt) => setSelectedSetor(opt)}
                placeholder="Selecione o setor..."
                isLoading={loading}
                className={styles.reactSelect}
                isClearable
                noOptionsMessage={() => "Nenhum setor encontrado"}
              />
            </div>

            {error && <p className={styles.errorMessage}>{error}</p>}

            <div className={styles.buttonGroup}>
              <button type="submit" disabled={loading} className={styles.btnRegister}>
                {loading ? "Processando..." : "Cadastrar"}
              </button>
              <button type="button" onClick={() => router.back()} className={styles.btnBack}>
                Voltar
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}