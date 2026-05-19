import { Response, Request } from "express";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import prismaClient from "../../../prisma";
import { UploadedFile } from "express-fileupload";

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

type UpdateOrdemdeServicoRequest = {
  prioridade_id?: string;
  tecnico_id?: string;
  statusOrdemdeServico_id?: string;
  tipodeChamado_id?: string;
  tipodeOrdemdeServico_id?: string;
  informacoesSetorId?: string;
  instituicaoUnidade_id?: string;
  cliente_id?: string;
  equipamentoid?: string;
  tarefa_id?: string;
  nameTecnico?: string;
  diagnostico?: string;
  solucao?: string;
  assinante?: string;
  descricaodoProblemaouSolicitacao?: string;
  assinatura?: string; // String Base64 vinda do Mobile (vai para bannerassinatura)
  startedAt?: string;
  endedAt?: string;
  duracao?: number;
  atividades_ids?: string; // JSON string vindo do mobile
};

class UpdateOrdemdeServicoService {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "ID da ordem é obrigatório." });
      }

      const {
        prioridade_id,
        tecnico_id,
        statusOrdemdeServico_id,
        equipamentoid,
        tipodeChamado_id,
        tipodeOrdemdeServico_id,
        informacoesSetorId,
        instituicaoUnidade_id,
        cliente_id,
        tarefa_id,
        nameTecnico,
        diagnostico,
        solucao,
        descricaodoProblemaouSolicitacao,
        assinatura,
        startedAt,
        endedAt,
        duracao,
        assinante,
        atividades_ids
      } = req.body as UpdateOrdemdeServicoRequest;

      let bannerassinaturaUrl: string | undefined;

      // --- LOGICA DE UPLOAD DA ASSINATURA ---
      // Se vier arquivo físico (pelo Multer/FileUpload)
      if ((req.files as any)?.file) {
        const file = (req.files as any).file as UploadedFile;
        const result: UploadApiResponse = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "ordens",
        });
        bannerassinaturaUrl = result.secure_url;
      } 
      // Se vier a string Base64 do Mobile
      else if (assinatura && assinatura.startsWith("data:image")) {
        const result: UploadApiResponse = await cloudinary.uploader.upload(assinatura, {
          folder: "assinaturas_digitais",
        });
        bannerassinaturaUrl = result.secure_url;
      }

      // --- TRATAMENTO DE ATIVIDADES (Many-to-Many) ---
      let atividadesConnect = [];
      if (atividades_ids) {
        const ids = JSON.parse(atividades_ids) as string[];
        atividadesConnect = ids.map(idAtiv => ({
          atividadePadrao: { connect: { id: idAtiv } }
        }));
      }

      // --- ATUALIZAÇÃO NO PRISMA ---
      const updatedRecord = await prismaClient.ordemdeServico.update({
        where: { id },
        data: {
          nameTecnico,
          diagnostico,
          solucao,
          assinante,
          descricaodoProblemaouSolicitacao: descricaodoProblemaouSolicitacao?.trim(),
          
          // Campos de Imagem
          ...(bannerassinaturaUrl && { bannerassinatura: bannerassinaturaUrl }),
          
          // Tempos (Garante que 0 seja gravado)
          duracao: duracao !== undefined ? Number(duracao) : undefined,
          startedAt: startedAt ? new Date(startedAt) : undefined,
          endedAt: endedAt ? new Date(endedAt) : undefined,

          // Relacionamentos (Usando os campos do seu Schema)
          statusOrdemdeServico: statusOrdemdeServico_id ? { connect: { id: statusOrdemdeServico_id } } : undefined,
          tecnico: tecnico_id ? { connect: { id: tecnico_id } } : undefined,
          tipodeChamado: tipodeChamado_id ? { connect: { id: tipodeChamado_id } } : undefined,
          tipodeOrdemdeServico: tipodeOrdemdeServico_id ? { connect: { id: tipodeOrdemdeServico_id } } : undefined,
          prioridade: prioridade_id ? { connect: { id: prioridade_id } } : undefined,
          equipamento: equipamentoid ? { connect: { id: equipamentoid } } : undefined,
          tarefa: tarefa_id ? { connect: { id: tarefa_id } } : undefined,
          informacoesSetor: informacoesSetorId ? { connect: { id: informacoesSetorId } } : undefined,
        
          cliente: cliente_id ? { connect: { id: cliente_id } } : undefined,
          instituicaoUnidade: instituicaoUnidade_id ? { connect: { id: instituicaoUnidade_id } } : undefined,
                  
          atividades: atividadesConnect.length > 0 ? {
            create: atividadesConnect
          } : undefined,
        },
        include: {
          atividades: true,
          statusOrdemdeServico: true
        }
      });

      return res.json({
        message: "Ordem de Serviço atualizada com sucesso.",
        ordem: updatedRecord,
      });

    } catch (error: any) {
      console.error("Erro ao atualizar OS:", error);
      return res.status(400).json({ error: error.message });
    }
  }
}

export { UpdateOrdemdeServicoService };