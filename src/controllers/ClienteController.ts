import { AtualizarClienteInput, Cliente } from '../models/Cliente'
import { ClienteService } from '../services/ClienteService'
import { Cli } from '../utils/Cli'
import { DomainError } from '../utils/DomainError'
import { parsePositiveInteger } from '../utils/validation.util'

export class ClienteController {
  constructor(
    private readonly cli: Cli,
    private readonly clienteService: ClienteService
  ) {}

  async cadastrar(): Promise<void> {
    try {
      this.cli.writeLine('Cadastro de cliente')

      const cliente = await this.clienteService.criar({
        nome: await this.cli.ask('Nome: '),
        email: await this.cli.ask('Email: '),
        telefone: await this.cli.ask('Telefone: '),
        documento: await this.cli.ask('Documento (CPF/CNPJ): ')
      })

      this.cli.writeLine(
        `Cliente cadastrado com sucesso. ID: ${String(cliente.id)}`
      )
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async listar(): Promise<void> {
    try {
      const clientes = await this.clienteService.listar()

      this.cli.writeLine('Clientes cadastrados')

      if (clientes.length === 0) {
        this.cli.writeLine('Nenhum cliente cadastrado.')
        await this.cli.pause()
        return
      }

      clientes.forEach((cliente) => {
        this.showClienteResumo(cliente)
      })
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async consultar(): Promise<void> {
    try {
      const id = await this.askId('ID do cliente: ')
      const cliente = await this.clienteService.buscarPorId(id)

      this.showClienteDetalhado(cliente)
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async atualizar(): Promise<void> {
    try {
      const id = await this.askId('ID do cliente que deseja atualizar: ')
      const cliente = await this.clienteService.buscarPorId(id)

      this.cli.writeLine('Deixe em branco para manter o valor atual.')
      this.showClienteDetalhado(cliente)

      const input = this.removeEmptyFields({
        nome: await this.cli.ask('Novo nome: '),
        email: await this.cli.ask('Novo email: '),
        telefone: await this.cli.ask('Novo telefone: '),
        documento: await this.cli.ask('Novo documento: ')
      })

      const updated = await this.clienteService.atualizar(id, input)

      this.cli.writeLine(
        `Cliente atualizado com sucesso. ID: ${String(updated.id)}`
      )
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async remover(): Promise<void> {
    try {
      const id = await this.askId('ID do cliente que deseja remover: ')
      const cliente = await this.clienteService.buscarPorId(id)

      this.showClienteDetalhado(cliente)

      const confirmation = await this.cli.ask('Confirmar remocao? (s/n): ')

      if (confirmation.toLowerCase() !== 's') {
        this.cli.writeLine('Remocao cancelada.')
        await this.cli.pause()
        return
      }

      await this.clienteService.remover(id)
      this.cli.writeLine('Cliente removido com sucesso.')
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  private async askId(message: string): Promise<number> {
    const value = await this.cli.ask(message)

    return parsePositiveInteger(value, 'ID')
  }

  private removeEmptyFields(
    input: Record<keyof AtualizarClienteInput, string>
  ): AtualizarClienteInput {
    const output: AtualizarClienteInput = {}

    if (input.nome.trim().length > 0) {
      output.nome = input.nome
    }

    if (input.email.trim().length > 0) {
      output.email = input.email
    }

    if (input.telefone.trim().length > 0) {
      output.telefone = input.telefone
    }

    if (input.documento.trim().length > 0) {
      output.documento = input.documento
    }

    return output
  }

  private showClienteResumo(cliente: Cliente): void {
    this.cli.writeLine(
      `${String(cliente.id)} | ${cliente.nome} | ${cliente.email}`
    )
  }

  private showClienteDetalhado(cliente: Cliente): void {
    this.cli.writeLine(`ID: ${String(cliente.id)}`)
    this.cli.writeLine(`Nome: ${cliente.nome}`)
    this.cli.writeLine(`Email: ${cliente.email}`)
    this.cli.writeLine(`Telefone: ${cliente.telefone ?? 'Nao informado'}`)
    this.cli.writeLine(`Documento: ${cliente.documento ?? 'Nao informado'}`)
  }

  private handleError(error: unknown): void {
    if (error instanceof DomainError) {
      this.cli.writeLine(error.message)
      return
    }

    console.error(error)
    this.cli.writeLine('Erro inesperado. Verifique a conexao com o banco.')
  }
}
