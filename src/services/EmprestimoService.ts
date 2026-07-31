import {
  Emprestimo,
  RegistrarEmprestimoData,
  RegistrarEmprestimoInput
} from '../models/Emprestimo'
import { ClienteRepository } from '../repositories/ClienteRepository'
import { EmprestimoRepository } from '../repositories/EmprestimoRepository'
import { LivroRepository } from '../repositories/LivroRepository'
import {
  getRaisedExceptionMessage,
  isForeignKeyViolation,
  isUniqueViolation
} from '../utils/database.util'
import { DomainError } from '../utils/DomainError'
import {
  normalizeOptionalText,
  parseIntegerInRange,
  parsePositiveInteger
} from '../utils/validation.util'

const EMPRESTIMO_ATIVO_CONSTRAINT = 'uq_emprestimos_livro_cliente_ativo'
const EMPRESTIMO_FUNCIONARIO_CONSTRAINT = 'fk_emprestimos_funcionario'
const DIAS_PADRAO = 7
const DIAS_MINIMO = 1
const DIAS_MAXIMO = 90

export class EmprestimoService {
  constructor(
    private readonly emprestimoRepository: EmprestimoRepository,
    private readonly livroRepository: LivroRepository,
    private readonly clienteRepository: ClienteRepository
  ) {}

  async registrar(input: RegistrarEmprestimoInput): Promise<Emprestimo> {
    const livroId = parsePositiveInteger(input.livroId, 'ID do livro')
    const clienteId = parsePositiveInteger(input.clienteId, 'ID do cliente')

    const livro = await this.livroRepository.findById(livroId)

    if (!livro) {
      throw new DomainError('Livro nao encontrado.')
    }

    const cliente = await this.clienteRepository.findById(clienteId)

    if (!cliente) {
      throw new DomainError('Cliente nao encontrado.')
    }

    if (livro.quantidadeDisponivel <= 0) {
      throw new DomainError(
        `Livro "${livro.titulo}" nao possui exemplar disponivel.`
      )
    }

    const data: RegistrarEmprestimoData = {
      livroId,
      clienteId,
      funcionarioId: this.parseFuncionarioId(input.funcionarioId),
      diasParaDevolucao:
        input.diasParaDevolucao === undefined
          ? DIAS_PADRAO
          : parseIntegerInRange(
              input.diasParaDevolucao,
              'Prazo em dias',
              DIAS_MINIMO,
              DIAS_MAXIMO
            ),
      observacao: normalizeOptionalText(input.observacao)
    }

    return await this.runProtegido(
      async () => await this.emprestimoRepository.create(data)
    )
  }

  async registrarDevolucao(id: number): Promise<Emprestimo> {
    const emprestimo = await this.buscarPorId(id)

    if (emprestimo.status === 'DEVOLVIDO') {
      throw new DomainError('Este emprestimo ja foi devolvido.')
    }

    const devolvido = await this.runProtegido(
      async () => await this.emprestimoRepository.registrarDevolucao(id)
    )

    if (!devolvido) {
      throw new DomainError('Emprestimo nao encontrado para devolucao.')
    }

    return devolvido
  }

  async listar(): Promise<Emprestimo[]> {
    await this.emprestimoRepository.atualizarAtrasados()

    return await this.emprestimoRepository.findAll()
  }

  async listarPendentes(): Promise<Emprestimo[]> {
    await this.emprestimoRepository.atualizarAtrasados()

    return await this.emprestimoRepository.findByStatus(['ATIVO', 'ATRASADO'])
  }

  async buscarPorId(id: number): Promise<Emprestimo> {
    const emprestimo = await this.emprestimoRepository.findById(id)

    if (!emprestimo) {
      throw new DomainError('Emprestimo nao encontrado.')
    }

    return emprestimo
  }

  private parseFuncionarioId(value: string | undefined): number | null {
    const normalized = normalizeOptionalText(value)

    if (!normalized) {
      return null
    }

    return parsePositiveInteger(normalized, 'ID do funcionario')
  }

  private async runProtegido<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (isUniqueViolation(error, EMPRESTIMO_ATIVO_CONSTRAINT)) {
        throw new DomainError(
          'Este cliente ja possui um emprestimo ativo deste livro.'
        )
      }

      if (isForeignKeyViolation(error, EMPRESTIMO_FUNCIONARIO_CONSTRAINT)) {
        throw new DomainError('Funcionario nao encontrado.')
      }

      // Regras defendidas por trigger, como a indisponibilidade do livro.
      const raised = getRaisedExceptionMessage(error)

      if (raised) {
        throw new DomainError(raised)
      }

      if (
        error instanceof Error &&
        error.message === 'Livro indisponivel para emprestimo'
      ) {
        throw new DomainError('Livro indisponivel para emprestimo.')
      }

      throw error
    }
  }
}
