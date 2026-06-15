"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import styles from "../modalCardCompras/editForm.module.scss";
import { OrdemdeServicoProps } from "@/lib/getOrdemdeServico.type";
import { getCookieClient } from "@/lib/cookieClient";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import { MdUpload } from "react-icons/md";
import { MdDeleteOutline } from "react-icons/md";

type Status = { id: string; name: string };
type Tecnicos = { id: string; name: string };

type Props = {
  ordemdeServico: OrdemdeServicoProps;
  onClose: () => void;
};

type FotoProps = {
  id: string;
  url: string;
  ordemdeServico_id: string;
};

export default function ViewCardFoto({ ordemdeServico, onClose }: Props) {
  const router = useRouter();

  const [fotos, setFotos] = useState<FotoProps[]>([]);
  const [selectedFoto, setSelectedFoto] = useState<FotoProps | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getCookieClient();

        const fotosRes = await api.get(`/foto/${ordemdeServico.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFotos(fotosRes.data);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };
    fetchData();
  }, [ordemdeServico.id]);

  const handleDeleteFoto = async (id: string) => {
    try {
      const token = await getCookieClient();
      await api.delete(`/foto/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFotos((prev) => prev.filter((foto) => foto.id !== id));
      setSelectedFoto(null);
    } catch (error) {
      console.error("Erro ao deletar foto:", error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const token = await getCookieClient();
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("ordemdeServico_id", ordemdeServico.id);
        const res = await api.post("/foto", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": undefined,
          },
        });
        const novas = Array.isArray(res.data) ? res.data : [res.data];
        setFotos((prev) => [...novas, ...prev]);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.editForm}>
      <h3>
        <HiOutlinePencilSquare className={styles.icon} />
        Imagens da Ordem de Serviço:
      </h3>

     
   <div className={styles.fotosGrid}>
  { (fotos == null) ? (        
      <p>Carregando imagens...</p>
    ) : (Array.isArray(fotos) && fotos.length > 0) ? (
      fotos.map((foto) => (
        <div key={foto.id} className={styles.fotoCard} onClick={() => setSelectedFoto(foto)}>
          <img src={foto.url} alt={`Foto ${foto.id}`} />
        </div>
      ))
    ) : (
      <p>Nenhuma foto adicionada para esta ordem.</p>
    )
  }
</div>


      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleUpload}
      />

      <div className={styles.buttonArea}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <MdUpload size={18} />
          {uploading ? "Enviando..." : "Adicionar Fotos"}
        </button>
        <button onClick={onClose} type="button">
          Fechar
        </button>
      </div>

      {/* Painel/Lightbox */}
      {selectedFoto && (
        <div className={styles.lightbox} onClick={() => setSelectedFoto(null)}>
          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
             <div className={styles.lightboxActions}>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDeleteFoto(selectedFoto.id)}
              >
                <MdDeleteOutline size={18} /> Excluir
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedFoto(null)}>✕
              </button>
            </div>

            <img src={selectedFoto.url} alt="Visualização" />
           
          </div>
        </div>
      )}
    </div>
  );
}
