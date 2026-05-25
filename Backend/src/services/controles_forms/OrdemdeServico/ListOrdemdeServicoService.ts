import prismaClient from "../../../prisma";

interface ListRequest {
  user_id: string;
  startDate?: string;    
  endDate?: string;      
  cliente_id?: string;   
  instituicao_id?: string; 
  tarefa_id?: string; 
}

class ListOrdemdeServicoService {
  async execute({ 
    user_id, 
    startDate, 
    endDate, 
    cliente_id, 
    instituicao_id, 
    tarefa_id 
  }: ListRequest) {
    
    const user = await prismaClient.user.findFirst({
      where: { id: user_id },
      select: {
        role: true,
        tecnico_id: true,
      }
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // 1. Inicia o objeto de filtros vazio
    let whereCondition: any = {};

    // 2. Aplica restrição por Role (Segurança)
    if (user.role === "TECNICO") {
      if (!user.tecnico_id) {
        return { 
          controles: [], total: 0, totalAberta: 0, totalEmAndamento: 0, 
          totalConcluida: 0, totalPausada: 0, totalTicket: 0, totalOrdemdeServico: 0, totalEmDeslocamento: 0
        }; 
      }
      whereCondition = {
        tecnico_id: user.tecnico_id,
        statusOrdemdeServico_id: {
          not: "fa69ed32-20b2-4d3a-9a6d-e61c5b45efea"
        }
      };
    }

    // 3. Aplica filtros de Período (agendadoEm) para o calendário de OS reagendadas
    if (startDate || endDate) {
      whereCondition.agendadoEm = {};
      
      if (startDate) {
        whereCondition.agendadoEm.gte = new Date(startDate);
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999); 
        whereCondition.agendadoEm.lte = end;
      }
    }

    // 4. Aplica filtros de Entidade (Cliente/Unidade/Tarefa)
    if (cliente_id) {
      whereCondition.cliente_id = cliente_id;
    }

    if (instituicao_id) {
      whereCondition.instituicaoUnidade_id = instituicao_id;
    }

    // Novo filtro de Tarefa incorporado
    if (tarefa_id) {
      whereCondition.tarefa_id = tarefa_id;
    }

    // Busca principal com os filtros acumulados
    console.log("[LIST-OS] iniciando query Prisma | whereCondition:", JSON.stringify(whereCondition));
    const controles = await prismaClient.ordemdeServico.findMany({
      where: whereCondition,
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        numeroOS: true,
        name: true,
        descricaodoProblemaouSolicitacao: true,
        patrimoniodoequipamento: true,
        nomedoContatoaserProcuradonoLocal: true,
        agendadoEm: true,
        created_at: true,
        updatedAt: true, 
        nameTecnico: true,
        diagnostico: true,
        solucao: true,
        assinante: true,
        bannerassinatura: true,
        duracao: true,
        startedAt: true,
        endedAt: true,
        
        atividades: {
          select: {
            id: true,
            atividadePadrao: {
              select: { id: true, descricao: true, categoria: true }
            }
          }
        },

        equipamento:{
          select:{ id: true, name: true, patrimonio: true }
        },
        tarefa: {
          select: {id: true, name: true}
        },
        statusOrdemdeServico: {
          select: { id: true, name: true },
        },
        instituicaoUnidade: {
          select: { id: true, name: true, endereco: true },
        },
        informacoesSetor:{
          select:{
            id: true,
            usuario: true,
            ramal: true,
            andar: true,
            setor: { select: { id: true, name: true } },
            instituicaoUnidade: { select: { id: true, name: true, endereco: true } },
            cliente: { select: { id: true, name: true, endereco: true, cnpj: true } }
          }
        },
        cliente: {
          select: { id: true, name: true, endereco: true },
        },
        tecnico: {
          select: { id: true, name: true },
        },
        tipodeChamado: {
          select: { id: true, name: true },
        },
        tipodeOrdemdeServico: {
          select:{ id: true, name: true }
        },
        prioridade: {
          select:{ id: true, name: true }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            instituicaoUnidade: { select: { id: true, name: true, endereco: true } },
            cliente: { select: { id: true, name: true, endereco: true } },
          },
        },
      },
    });

    console.log("[LIST-OS] primeiros 2 resultados agendadoEm:", controles.slice(0, 2).map(c => ({ id: c.id, numeroOS: c.numeroOS, agendadoEm: c.agendadoEm })));
    const [
      total, 
      totalAberta,
      totalEmDeslocamento, 
      totalEmAndamento, 
      totalPausada, 
      totalConcluida, 
      totalTicket, 
      totalOrdemdeServico
    ] = await Promise.all([
      prismaClient.ordemdeServico.count({ where: whereCondition }),
      prismaClient.ordemdeServico.count({ where: { ...whereCondition, statusOrdemdeServico: { name: "ABERTA" } } }),
      prismaClient.ordemdeServico.count({ where: { ...whereCondition, statusOrdemdeServico: { name: "EM DESLOCAMENTO" } } }),
      prismaClient.ordemdeServico.count({ where: { ...whereCondition, statusOrdemdeServico: { name: "EM ANDAMENTO" } } }),
      prismaClient.ordemdeServico.count({ where: { ...whereCondition, statusOrdemdeServico: { name: "PAUSADA" } } }),
      prismaClient.ordemdeServico.count({ where: { ...whereCondition, statusOrdemdeServico: { name: "CONCLUIDA" } } }),
      prismaClient.ordemdeServico.count({ where: { ...whereCondition, tipodeOrdemdeServico: { name: "TICKET" } } }),
      prismaClient.ordemdeServico.count({ where: { ...whereCondition, tipodeOrdemdeServico: { name: "ORDEM DE SERVICO" } } }),
    ]);

    return {
      controles,
      total,
      totalAberta,
      totalEmDeslocamento,
      totalEmAndamento,
      totalConcluida,
      totalPausada,
      totalTicket,
      totalOrdemdeServico
    };
  }
}

export { ListOrdemdeServicoService };