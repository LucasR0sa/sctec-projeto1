import { AtualizarFuncionarioInput, Funcionario } from '../models/Funcionario'
import { FuncionarioService } from '../services/FuncionarioService'
import { Cli, CliClosedError } from '../utils/Cli'
import { DomainError } from '../utils/DomainError'
import { parsePositiveInteger } from '../utils/validation.util'

export class FuncionarioController {
  constructor(
    private readonly cli: Cli,
    private readonly funcionarioService: FuncionarioService
  ) {}

  async cadastrar(): Promise<void> {
    try {
      this.cli.writeLine('Cadastro de funcionario')

      const funcionario = await this.funcionarioService.criar({
        nome: await this.cli.ask('Nome: '),
        matricula: await this.cli.ask('Matricula: '),
        email: await this.cli.ask('Email: '),
        senha: await this.cli.ask('Senha (minimo 6 caracteres): ')
      })

      this.cli.writeLine(
        `Funcionario cadastrado com sucesso. ID: ${String(funcionario.id)}`
      )
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async listar(): Promise<void> {
    try {
      const funcionarios = await this.funcionarioService.listar()

      this.cli.writeLine('Funcionarios cadastrados')

      if (funcionarios.length === 0) {
        this.cli.writeLine('Nenhum funcionario cadastrado.')
        await this.cli.pause()
        return
      }

      funcionarios.forEach((funcionario) => {
        this.cli.writeLine(
          `${String(funcionario.id)} | ${funcionario.matricula} | ${funcionario.nome} | ${funcionario.email}`
        )
      })
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async consultar(): Promise<void> {
    try {
      const id = await this.askId('ID do funcionario: ')
      const funcionario = await this.funcionarioService.buscarPorId(id)

      this.showFuncionarioDetalhado(funcionario)
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async atualizar(): Promise<void> {
    try {
      const id = await this.askId('ID do funcionario que deseja atualizar: ')
      const funcionario = await this.funcionarioService.buscarPorId(id)

      this.cli.writeLine('Deixe em branco para manter o valor atual.')
      this.showFuncionarioDetalhado(funcionario)

      const input = this.removeEmptyFields({
        nome: await this.cli.ask('Novo nome: '),
        matricula: await this.cli.ask('Nova matricula: '),
        email: await this.cli.ask('Novo email: '),
        senha: await this.cli.ask('Nova senha: ')
      })

      const updated = await this.funcionarioService.atualizar(id, input)

      this.cli.writeLine(
        `Funcionario atualizado com sucesso. ID: ${String(updated.id)}`
      )
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async remover(): Promise<void> {
    try {
      const id = await this.askId('ID do funcionario que deseja remover: ')
      const funcionario = await this.funcionarioService.buscarPorId(id)

      this.showFuncionarioDetalhado(funcionario)

      const confirmation = await this.cli.ask('Confirmar remocao? (s/n): ')

      if (confirmation.toLowerCase() !== 's') {
        this.cli.writeLine('Remocao cancelada.')
        await this.cli.pause()
        return
      }

      await this.funcionarioService.remover(id)
      this.cli.writeLine('Funcionario removido com sucesso.')
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
    input: Record<keyof AtualizarFuncionarioInput, string>
  ): AtualizarFuncionarioInput {
    const output: AtualizarFuncionarioInput = {}

    if (input.nome.trim().length > 0) {
      output.nome = input.nome
    }

    if (input.matricula.trim().length > 0) {
      output.matricula = input.matricula
    }

    if (input.email.trim().length > 0) {
      output.email = input.email
    }

    if (input.senha.trim().length > 0) {
      output.senha = input.senha
    }

    return output
  }

  private showFuncionarioDetalhado(funcionario: Funcionario): void {
    this.cli.writeLine(`ID: ${String(funcionario.id)}`)
    this.cli.writeLine(`Nome: ${funcionario.nome}`)
    this.cli.writeLine(`Matricula: ${funcionario.matricula}`)
    this.cli.writeLine(`Email: ${funcionario.email}`)
  }

  private handleError(error: unknown): void {
    if (error instanceof CliClosedError) {
      throw error
    }

    if (error instanceof DomainError) {
      this.cli.writeLine(error.message)
      return
    }

    console.error(error)
    this.cli.writeLine('Erro inesperado. Verifique a conexao com o banco.')
  }
}
