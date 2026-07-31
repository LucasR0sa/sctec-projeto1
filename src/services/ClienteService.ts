import {
  AtualizarClienteInput,
  Cliente,
  CriarClienteInput,
  SalvarClienteData
} from '../models/Cliente'
import { ClienteRepository } from '../repositories/ClienteRepository'
import { isUniqueViolation } from '../utils/database.util'
import { DomainError } from '../utils/DomainError'
import {
  parseEmail,
  parseOptionalDocumento,
  parseOptionalTelefone,
  requireMinText
} from '../utils/validation.util'

const CLIENTE_EMAIL_CONSTRAINT = 'clientes_email_key'
const CLIENTE_DOCUMENTO_CONSTRAINT = 'clientes_documento_key'

export class ClienteService {
  constructor(private readonly clienteRepository: ClienteRepository) {}

  async criar(input: CriarClienteInput): Promise<Cliente> {
    const data: SalvarClienteData = {
      nome: requireMinText(input.nome, 'Nome do cliente', 3),
      email: parseEmail(input.email),
      telefone: parseOptionalTelefone(input.telefone),
      documento: parseOptionalDocumento(input.documento)
    }

    await this.ensureEmailIsAvailable(data.email)
    await this.ensureDocumentoIsAvailable(data.documento)

    return await this.runProtegido(
      async () => await this.clienteRepository.create(data)
    )
  }

  async listar(): Promise<Cliente[]> {
    return await this.clienteRepository.findAll()
  }

  async buscarPorId(id: number): Promise<Cliente> {
    const cliente = await this.clienteRepository.findById(id)

    if (!cliente) {
      throw new DomainError('Cliente nao encontrado.')
    }

    return cliente
  }

  async atualizar(id: number, input: AtualizarClienteInput): Promise<Cliente> {
    const current = await this.buscarPorId(id)
    const data = await this.prepareUpdateData(current, input)
    const updated = await this.runProtegido(
      async () => await this.clienteRepository.update(id, data)
    )

    if (!updated) {
      throw new DomainError('Cliente nao encontrado para atualizacao.')
    }

    return updated
  }

  async remover(id: number): Promise<Cliente> {
    await this.buscarPorId(id)

    const emprestimosAtivos =
      await this.clienteRepository.countEmprestimosAtivos(id)

    if (emprestimosAtivos > 0) {
      throw new DomainError(
        `Cliente possui ${String(emprestimosAtivos)} emprestimo(s) ativo(s) e nao pode ser removido.`
      )
    }

    const removed = await this.clienteRepository.remove(id)

    if (!removed) {
      throw new DomainError('Cliente nao encontrado para remocao.')
    }

    return removed
  }

  private async prepareUpdateData(
    current: Cliente,
    input: AtualizarClienteInput
  ): Promise<SalvarClienteData> {
    const email =
      input.email === undefined ? current.email : parseEmail(input.email)

    if (email !== current.email) {
      await this.ensureEmailIsAvailable(email, current.id)
    }

    const documento =
      input.documento === undefined
        ? current.documento
        : parseOptionalDocumento(input.documento)

    if (documento !== current.documento) {
      await this.ensureDocumentoIsAvailable(documento, current.id)
    }

    return {
      nome:
        input.nome === undefined
          ? current.nome
          : requireMinText(input.nome, 'Nome do cliente', 3),
      email,
      telefone:
        input.telefone === undefined
          ? current.telefone
          : parseOptionalTelefone(input.telefone),
      documento
    }
  }

  private async ensureEmailIsAvailable(
    email: string,
    ignoredId?: number
  ): Promise<void> {
    const existing = await this.clienteRepository.findByEmail(email)

    if (existing && existing.id !== ignoredId) {
      throw new DomainError(this.mensagemDuplicidade('email', existing))
    }
  }

  private async ensureDocumentoIsAvailable(
    documento: string | null,
    ignoredId?: number
  ): Promise<void> {
    if (documento === null) {
      return
    }

    const existing = await this.clienteRepository.findByDocumento(documento)

    if (existing && existing.id !== ignoredId) {
      throw new DomainError(this.mensagemDuplicidade('documento', existing))
    }
  }

  /**
   * Email e documento seguem reservados apos a remocao logica, entao a mensagem
   * precisa dizer que o cadastro existe mas esta inativo. Sem isso o usuario
   * procura o registro na listagem e nao encontra.
   */
  private mensagemDuplicidade(campo: string, existing: Cliente): string {
    return existing.ativo
      ? `Ja existe um cliente cadastrado com esse ${campo}.`
      : `Ja existe um cliente inativo (ID ${String(existing.id)}) com esse ${campo}.`
  }

  private async runProtegido<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (isUniqueViolation(error, CLIENTE_EMAIL_CONSTRAINT)) {
        throw new DomainError('Ja existe um cliente cadastrado com esse email.')
      }

      if (isUniqueViolation(error, CLIENTE_DOCUMENTO_CONSTRAINT)) {
        throw new DomainError(
          'Ja existe um cliente cadastrado com esse documento.'
        )
      }

      throw error
    }
  }
}
