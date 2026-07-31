import {
  AtualizarFuncionarioInput,
  CriarFuncionarioInput,
  Funcionario,
  SalvarFuncionarioData
} from '../models/Funcionario'
import { FuncionarioRepository } from '../repositories/FuncionarioRepository'
import { isUniqueViolation } from '../utils/database.util'
import { DomainError } from '../utils/DomainError'
import { hashSenha } from '../utils/password.util'
import { parseEmail, requireMinText } from '../utils/validation.util'

const FUNCIONARIO_MATRICULA_CONSTRAINT = 'funcionarios_matricula_key'
const FUNCIONARIO_EMAIL_CONSTRAINT = 'funcionarios_email_key'

export class FuncionarioService {
  constructor(private readonly funcionarioRepository: FuncionarioRepository) {}

  async criar(input: CriarFuncionarioInput): Promise<Funcionario> {
    const data: SalvarFuncionarioData = {
      nome: requireMinText(input.nome, 'Nome do funcionario', 3),
      matricula: requireMinText(input.matricula, 'Matricula', 3).toUpperCase(),
      email: parseEmail(input.email),
      senhaHash: hashSenha(input.senha)
    }

    await this.ensureMatriculaIsAvailable(data.matricula)
    await this.ensureEmailIsAvailable(data.email)

    return await this.runProtegido(
      async () => await this.funcionarioRepository.create(data)
    )
  }

  async listar(): Promise<Funcionario[]> {
    return await this.funcionarioRepository.findAll()
  }

  async buscarPorId(id: number): Promise<Funcionario> {
    const funcionario = await this.funcionarioRepository.findById(id)

    if (!funcionario) {
      throw new DomainError('Funcionario nao encontrado.')
    }

    return funcionario
  }

  async atualizar(
    id: number,
    input: AtualizarFuncionarioInput
  ): Promise<Funcionario> {
    const current = await this.buscarPorId(id)
    const data = await this.prepareUpdateData(current, input)
    const updated = await this.runProtegido(
      async () => await this.funcionarioRepository.update(id, data)
    )

    if (!updated) {
      throw new DomainError('Funcionario nao encontrado para atualizacao.')
    }

    return updated
  }

  async remover(id: number): Promise<Funcionario> {
    await this.buscarPorId(id)

    const emprestimosAtivos =
      await this.funcionarioRepository.countEmprestimosAtivos(id)

    if (emprestimosAtivos > 0) {
      throw new DomainError(
        `Funcionario responde por ${String(emprestimosAtivos)} emprestimo(s) ativo(s) e nao pode ser removido.`
      )
    }

    const removed = await this.funcionarioRepository.remove(id)

    if (!removed) {
      throw new DomainError('Funcionario nao encontrado para remocao.')
    }

    return removed
  }

  private async prepareUpdateData(
    current: Funcionario,
    input: AtualizarFuncionarioInput
  ): Promise<SalvarFuncionarioData> {
    const matricula =
      input.matricula === undefined
        ? current.matricula
        : requireMinText(input.matricula, 'Matricula', 3).toUpperCase()

    if (matricula !== current.matricula) {
      await this.ensureMatriculaIsAvailable(matricula, current.id)
    }

    const email =
      input.email === undefined ? current.email : parseEmail(input.email)

    if (email !== current.email) {
      await this.ensureEmailIsAvailable(email, current.id)
    }

    return {
      nome:
        input.nome === undefined
          ? current.nome
          : requireMinText(input.nome, 'Nome do funcionario', 3),
      matricula,
      email,
      // Nulo mantem a senha atual; o repository resolve com COALESCE.
      senhaHash: input.senha === undefined ? null : hashSenha(input.senha)
    }
  }

  private async ensureMatriculaIsAvailable(
    matricula: string,
    ignoredId?: number
  ): Promise<void> {
    const existing = await this.funcionarioRepository.findByMatricula(matricula)

    if (existing && existing.id !== ignoredId) {
      throw new DomainError(this.mensagemDuplicidade('matricula', existing))
    }
  }

  private async ensureEmailIsAvailable(
    email: string,
    ignoredId?: number
  ): Promise<void> {
    const existing = await this.funcionarioRepository.findByEmail(email)

    if (existing && existing.id !== ignoredId) {
      throw new DomainError(this.mensagemDuplicidade('email', existing))
    }
  }

  private mensagemDuplicidade(campo: string, existing: Funcionario): string {
    return existing.ativo
      ? `Ja existe um funcionario cadastrado com esse ${campo}.`
      : `Ja existe um funcionario inativo (ID ${String(existing.id)}) com esse ${campo}.`
  }

  private async runProtegido<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (isUniqueViolation(error, FUNCIONARIO_MATRICULA_CONSTRAINT)) {
        throw new DomainError(
          'Ja existe um funcionario cadastrado com essa matricula.'
        )
      }

      if (isUniqueViolation(error, FUNCIONARIO_EMAIL_CONSTRAINT)) {
        throw new DomainError(
          'Ja existe um funcionario cadastrado com esse email.'
        )
      }

      throw error
    }
  }
}
