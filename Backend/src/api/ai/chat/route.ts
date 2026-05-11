import { createGroq } from "@ai-sdk/groq";
import { generateText, tool } from "ai";
import { z } from "zod";
import { ListTecnicoService } from "../../../services/status_categorias/tecnico/ListTecnicoService";
import { Request, Response } from "express";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

class AIChatController {
  async handle(req: Request, res: Response) {
    try {
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({ error: "Pergunta é obrigatória" });
      }

      const listService = new ListTecnicoService();

      // Forçamos o objeto todo como any para evitar que o TS bloqueie propriedades do Agente
    const result = await generateText({
        model: groq("llama-3.3-70b-versatile") as any,
        maxSteps: 5, 
        // Mudamos o system para ele entender que a tool é só o começo
        system: `Você é o assistente do AlltiControl.
        Sua tarefa é:
        1. Usar a ferramenta 'getTecnicos' para obter dados.
        2. EXIBIR os dados obtidos de forma clara para o usuário.
        3. Nunca responda com texto vazio. Se recebeu dados, escreva-os em português.`,
        prompt: question,
        tools: {
          getTecnicos: {
            description: "Lista os técnicos e o total.",
            parameters: z.object({}),
            execute: async () => {
              console.log("--- BUSCANDO NO BANCO ---");
              const data = await listService.execute();
              // Retornamos uma string simples para facilitar o entendimento da IA
              return `Temos ${data.total} técnicos. Nomes: ${data.controles.map((t: any) => t.name).join(", ")}`;
            },
          } as any,
        },
      } as any);

      // Se o text vier vazio, vamos tentar pegar do objeto de resposta bruta
      const finalAnswer = result.text || (result as any).response?.messages?.slice(-1)[0]?.content || "";

      console.log("DEBUG - Conteúdo bruto:", JSON.stringify(result, null, 2));

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