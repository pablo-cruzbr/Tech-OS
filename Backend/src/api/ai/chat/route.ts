import { createGroq } from "@ai-sdk/groq";
import { generateText, tool } from "ai";
import { z } from "zod";
import { ListTecnicoService } from "../../../services/status_categorias/tecnico/ListTecnicoService";
import { NextResponse } from "next/server";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: `Você é o assistente técnico do AlltiControl.
      Sua missão é consultar o banco de dados e responder dúvidas sobre a equipe técnica.
      
      Regras:
      1. Para perguntas sobre quem são os técnicos ou quantos existem, use a tool 'getTecnicos'.
      2. Responda sempre de forma amigável, estilo instrutor da Rocketseat.
      3. Se não houver técnicos, diga que a equipe ainda não foi cadastrada.`,
      
      prompt: question,
      
      tools: {
        getTecnicos: tool({
          description: "Lista todos os técnicos e retorna o total cadastrado no AlltiControl.",
          parameters: z.object({}), // Sem parâmetros por enquanto, como no seu Service
          execute: async () => {
            // Reutilizando seu Service original!
            const listService = new ListTecnicoService();
            const data = await listService.execute();
            
            return {
              tecnicos: data.controles,
              total: data.total
            };
          },
        }),
      },
      maxSteps: 5, // Permite que a IA chame a tool e depois formule a resposta
    });

    return NextResponse.json({ answer: result.text });

  } catch (error: any) {
    console.error("Erro no Agente:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}