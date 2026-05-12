import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { z } from "zod";
import { Request, Response } from "express";

import { ListTecnicoService } from "../../../services/status_categorias/tecnico/ListTecnicoService";
import { ListOrdemdeServicoService } from "../../../services/controles_forms/OrdemdeServico/ListOrdemdeServicoService";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

class AIChatController {
  async handle(req: Request, res: Response) {
    try {
      const { question } = req.body;
      const user_id = req.user_id;

      if (!question) {
        return res.status(400).json({ error: "Pergunta é obrigatória" });
      }

      const tecnicoService = new ListTecnicoService();
      const osService = new ListOrdemdeServicoService();

      const result = await generateText({
        model: groq("llama-3.3-70b-versatile") as any,
        maxSteps: 5, 
        system: `Você é o assistente do AlltiControl.
        Sua tarefa é:
        1. Usar as ferramentas disponíveis para obter dados do sistema.
        2. EXIBIR os dados obtidos de forma clara e profissional para o usuário.
        3. Se recebeu dados, escreva-os sempre em português.`,
        prompt: question,
        tools: {
          getTecnicos: {
            description: "Lista o total e os nomes dos técnicos.",
            parameters: z.object({}),
            execute: async () => {
              console.log("--- BUSCANDO TÉCNICOS ---");
              const data = await tecnicoService.execute();
              return `Temos ${data.total} técnicos cadastrados. Nomes: ${data.controles.map((t: any) => t.name).join(", ")}.`;
            },
          } as any,

          getEstatisticasOS: {
            description: "Obtém a quantidade total de Ordens de Serviço.",
            parameters: z.object({}),
            execute: async () => {
              console.log("--- BUSCANDO ESTATÍSTICAS DE OS ---");
              const data = await osService.execute({ user_id });
              return `Atualmente existem ${data.total} Ordens de Serviço no sistema.`;
            },
          } as any,
        },
      } as any);

      const finalAnswer = result.text || (result as any).response?.messages?.slice(-1)[0]?.content || "";

      console.log("DEBUG - Resposta Final:", finalAnswer);

      return res.json({ 
        answer: finalAnswer || "A IA processou os dados mas não formulou uma frase. Tente perguntar novamente." 
      });

    } catch (error: any) {
      console.error("Erro no Agente IA:", error);
      return res.status(500).json({ 
        error: "Erro ao gerar resposta", 
        details: error.message 
      });
    }
  }
}

export { AIChatController };