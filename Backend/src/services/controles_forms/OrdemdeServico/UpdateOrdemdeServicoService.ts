import { Response, Request } from "express";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import prismaClient from "../../../prisma";
import { UploadedFile } from "express-fileupload";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

type UpdateOrdemdeServicoRequest = {
  prioridade_id?: string;
  tecnico_id?: string;
  statusOrdemdeServico_id?: string;
  statusOrdemdeServico?: { connect: { id: string } }; 
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
  assinatura?: string;
  startedAt?: string;
  endedAt?: string;
  duracao?: number;
  atividades_ids?: string;
};

class UpdateOrdemdeServicoService {
  async handle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "ID da ordem é obrigatório." });
      }

      const body = req.body as UpdateOrdemdeServicoRequest;
      const updateData: any = {};
      let bannerassinaturaUrl: string | undefined;

      if ((req.files as any)?.file) {
        const file = (req.files as any).file as UploadedFile;
        const result: UploadApiResponse = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "ordens",
        });
        bannerassinaturaUrl = result.secure_url;
      } 
      else if (body.assinatura && body.assinatura.startsWith("data:image")) {
        const result: UploadApiResponse = await cloudinary.uploader.upload(body.assinatura, {
          folder: "assinaturas_digitais",
        });
        bannerassinaturaUrl = result.secure_url;
      }

      if (bannerassinaturaUrl) {
        updateData.bannerassinatura = bannerassinaturaUrl;
      }

      if (body.nameTecnico !== undefined) updateData.nameTecnico = body.nameTecnico;
      if (body.diagnostico !== undefined) updateData.diagnostico = body.diagnostico;
      if (body.solucao !== undefined) updateData.solucao = body.solucao;
      if (body.assinante !== undefined) updateData.assinante = body.assinante;
      
      if (body.descricaodoProblemaouSolicitacao !== undefined) {
        updateData.descricaodoProblemaouSolicitacao = body.descricaodoProblemaouSolicitacao?.trim();
      }

      if (body.duracao !== undefined) updateData.duracao = Number(body.duracao);
      if (body.startedAt) updateData.startedAt = new Date(body.startedAt);
      if (body.endedAt) updateData.endedAt = new Date(body.endedAt);

      const statusId = body.statusOrdemdeServico_id || body.statusOrdemdeServico?.connect?.id;
      if (statusId) {
        updateData.statusOrdemdeServico = { connect: { id: statusId } };
      }

      if (body.tecnico_id) updateData.tecnico = { connect: { id: body.tecnico_id } };
      if (body.tipodeChamado_id) updateData.tipodeChamado = { connect: { id: body.tipodeChamado_id } };
      if (body.tipodeOrdemdeServico_id) updateData.tipodeOrdemdeServico = { connect: { id: body.tipodeOrdemdeServico_id } };
      if (body.prioridade_id) updateData.prioridade = { connect: { id: body.prioridade_id } };
      if (body.equipamentoid) updateData.equipamento = { connect: { id: body.equipamentoid } };
      if (body.tarefa_id) updateData.tarefa = { connect: { id: body.tarefa_id } };
      if (body.informacoesSetorId) updateData.informacoesSetor = { connect: { id: body.informacoesSetorId } };
      if (body.cliente_id) updateData.cliente = { connect: { id: body.cliente_id } };
      if (body.instituicaoUnidade_id) updateData.instituicaoUnidade = { connect: { id: body.instituicaoUnidade_id } };

      if (body.atividades_ids) {
        try {
          const ids = JSON.parse(body.atividades_ids) as string[];
          if (ids.length > 0) {
            updateData.atividades = {
              create: ids.map(idAtiv => ({
                atividadePadrao: { connect: { id: idAtiv } }
              }))
            };
          }
        } catch (jsonErr) {
          console.error("Erro no parse do JSON de atividades_ids:", jsonErr);
        }
      }

      const updatedRecord = await prismaClient.ordemdeServico.update({
        where: { id },
        data: updateData,
        include: {
          atividades: true,
          statusOrdemdeServico: true
        }
      });

      return res.json({
        message: "Ordem de Serviço updated com sucesso.",
        ordem: updatedRecord,
      });

    } catch (error: any) {
      console.error("Erro interno capturado ao atualizar OS:", error);
      return res.status(400).json({ error: error.message || "Erro interno no servidor." });
    }
  }
}

export { UpdateOrdemdeServicoService };