'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import styles from './FormularioClientesMunicipais.module.scss';
import { IoArrowBackCircleOutline } from "react-icons/io5";
import { api } from '@/services/api';
import { toast } from 'sonner';
import { getCookieClient } from '@/lib/cookieClient';
export const dynamic = 'force-dynamic';
interface ItemProps {
  id: string;
  name: string;
}

interface TipoDeInstituicaoUnidade {
  id: string;
  name: string;
}

export default function FormularioClientesPrivados() {
  const [tipodeInstituicaoUnidade, setTipodeInstituicaoUnidade] = useState<TipoDeInstituicaoUnidade[]>([]);
  const router = useRouter();

  function handleBack() {
    router.push('/dashboard/clientesMunicipais');
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getCookieClient();

        const response = await api.get("/listtipodeinstituicaounidade", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Se vier array, atualiza, senão deixa vazio
        setTipodeInstituicaoUnidade(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      }
    }

    fetchData();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const form = event.currentTarget;
    const name = formData.get("name");
    const endereco = formData.get("endereco");
    const telefone = formData.get("telefone");
    const tipodeInstituicaoUnidade_id = formData.get("tipodeInstituicaoUnidade_id") as string;

    if (!name || !endereco || !tipodeInstituicaoUnidade_id) {
      alert("Por favor, preencha todos os campos!");
      return;
    }

    console.log("Form Data enviado:", {
      name,
      endereco,
      telefone,
      tipodeInstituicaoUnidade_id,
    });

    try {
      const token = await getCookieClient();

      await api.post(
        "/categoryintituicao",
        { name, endereco, telefone, tipodeInstituicaoUnidade_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cliente Municipal cadastrado com sucesso!');
      form.reset();
      //router.push("/dashboard/clientesMunicipais");
    } catch (err: any) {
      console.error("Erro ao enviar formulário:", err);
      if (err.response?.status === 400) {
        alert("Erro 400 - Verifique se todos os campos obrigatórios estão preenchidos corretamente.");
      } else {
        alert("Erro inesperado ao enviar formulário.");
      }
    }
  }

  return (
    <section>
      <div className={styles.headerClient}>
        <h1 className={styles.titleClient}>CADASTRAR UM NOVO CLIENTE MUNICIPAL</h1>
        <IoArrowBackCircleOutline size={30} color="#4B4B4B" onClick={handleBack} />
        <button className={styles.button} onClick={handleBack}>
          Voltar
        </button>
      </div>

      <div className={styles.container}>
        <section className={styles.login}>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              required
              name="name"
              placeholder="Insira o Nome Instituição"
              className={styles.input}
            />

            <input
              type="text"
              required
              name="endereco"
              placeholder="Insira o endereço da Instituição"
              className={styles.input}
            />

            <input
              type="text"
              required
              name="telefone"
              placeholder="Insira o telefone da Instituição"
              className={styles.input}
            />

            <select name="tipodeInstituicaoUnidade_id" className={styles.input} required>
              <option value="" disabled hidden>
                Selecione o Tipo de Insituição ou Unidade
              </option>
              {tipodeInstituicaoUnidade.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <button className={styles.button} type="submit">
              Registrar
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
