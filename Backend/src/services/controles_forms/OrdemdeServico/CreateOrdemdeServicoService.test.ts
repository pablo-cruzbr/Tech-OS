import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../prisma', () => ({
  default: {
    ordemdeServico: {
      create: vi.fn(),
    },
  },
}))

import prismaClient from '../../../prisma'
import { CreateOrdemdeServicoService } from './CreateOrdemdeServicoService'

const dadosValidos = {
  name: 'Computador sem ligar',
  descricaodoProblemaouSolicitacao: 'Máquina não liga após queda de energia',
  patrimoniodoequipamento: 'PAT-001',
  tipodeChamado_id: 'tipo-uuid-123',
  tipodeOrdemdeServico_id: 'tipoos-uuid-123',
  user_id: 'user-uuid-123',
  equipamento_id: 'equip-uuid-123',
}

const ordemCriadaFalsa = {
  id: 'os-uuid-789',
  numeroOS: 45231,
  name: 'Computador sem ligar',
  descricaodoProblemaouSolicitacao: 'Máquina não liga após queda de energia',
  patrimoniodoequipamento: 'PAT-001',
  cliente: null,
  tarefa: null,
  tecnico: null,
  tipodeChamado: { name: 'Corretiva' },
  tipodeOrdemdeServico: { name: 'Interna' },
  instituicaoUnidade: null,
  statusOrdemdeServico: null,
  user: { name: 'Pablo Cruz' },
  fotos: [],
  assinante: null,
}

describe('CreateOrdemdeServicoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve criar OS com sucesso quando todos os campos obrigatórios são informados', async () => {
    vi.mocked(prismaClient.ordemdeServico.create).mockResolvedValue(ordemCriadaFalsa as any)

    const service = new CreateOrdemdeServicoService()
    const resultado = await service.execute(dadosValidos)

    expect(resultado.id).toBe('os-uuid-789')
    expect(resultado.numeroOS).toBe(45231)
    expect(resultado.name).toBe('Computador sem ligar')
    expect(prismaClient.ordemdeServico.create).toHaveBeenCalledOnce()
  })

  it('deve lançar erro quando o nome da OS não é informado', async () => {
    const service = new CreateOrdemdeServicoService()

    await expect(
      service.execute({ ...dadosValidos, name: '' })
    ).rejects.toThrow('Campos obrigatórios não informados.')
  })

  it('deve lançar erro quando a descrição do problema não é informada', async () => {
    const service = new CreateOrdemdeServicoService()

    await expect(
      service.execute({ ...dadosValidos, descricaodoProblemaouSolicitacao: '' })
    ).rejects.toThrow('Campos obrigatórios não informados.')
  })

  it('deve lançar erro quando o patrimônio do equipamento não é informado', async () => {
    const service = new CreateOrdemdeServicoService()

    await expect(
      service.execute({ ...dadosValidos, patrimoniodoequipamento: '' })
    ).rejects.toThrow('Campos obrigatórios não informados.')
  })

  it('deve lançar erro de banco quando o Prisma falha', async () => {
    vi.mocked(prismaClient.ordemdeServico.create).mockRejectedValue(
      new Error('Connection refused')
    )

    const service = new CreateOrdemdeServicoService()

    await expect(service.execute(dadosValidos)).rejects.toThrow(
      'Erro ao salvar no banco de dados.'
    )
  })
})
