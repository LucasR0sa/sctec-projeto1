import { Emprestimo } from '../models/Emprestimo'
import { EmprestimoService } from '../services/EmprestimoService'
import { Cli } from '../utils/Cli'
import { DomainError } from '../utils/DomainError'
import { parsePositiveInteger } from '../utils/validation.util'

export class EmprestimoController {
  constructor(
    private readonly cli: Cli,
    private readonly emprestimoService: EmprestimoService
  ) {}

  async registrar(): Promise<void> {
    try {
      this.cli.writeLine('Registro de emprestimo')

      const emprestimo = await this.emprestimoService.registrar({
        livroId: await this.cli.ask('ID do livro: '),
        clienteId: await this.cli.ask('ID do cliente: '),
        funcionarioId: await this.cli.ask('ID do funcionario (opcional): '),
        diasParaDevolucao: await this.cli.ask('Prazo em dias (padrao 7): '),
        observacao: await this.cli.ask('Observacao: ')
      })

      this.cli.writeLine(
        `Emprestimo registrado com sucesso. ID: ${String(emprestimo.id)}`
      )
      this.cli.writeLine(
        `Devolucao prevista para ${emprestimo.dataPrevistaDevolucao}.`
      )
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async registrarDevolucao(): Promise<void> {
    try {
      const id = await this.askId('ID do emprestimo a devolver: ')
      const emprestimo = await this.emprestimoService.buscarPorId(id)

      this.showEmprestimoDetalhado(emprestimo)

      const confirmation = await this.cli.ask('Confirmar devolucao? (s/n): ')

      if (confirmation.toLowerCase() !== 's') {
        this.cli.writeLine('Devolucao cancelada.')
        await this.cli.pause()
        return
      }

      const devolvido = await this.emprestimoService.registrarDevolucao(id)

      this.cli.writeLine('Devolucao registrada com sucesso.')
      this.cli.writeLine(
        `O exemplar de "${devolvido.livroTitulo}" voltou para o acervo.`
      )
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async listar(): Promise<void> {
    try {
      const emprestimos = await this.emprestimoService.listar()

      this.cli.writeLine('Emprestimos registrados')
      this.showLista(emprestimos)
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async listarPendentes(): Promise<void> {
    try {
      const emprestimos = await this.emprestimoService.listarPendentes()

      this.cli.writeLine('Emprestimos em aberto')
      this.showLista(emprestimos)
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async consultar(): Promise<void> {
    try {
      const id = await this.askId('ID do emprestimo: ')
      const emprestimo = await this.emprestimoService.buscarPorId(id)

      this.showEmprestimoDetalhado(emprestimo)
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  private showLista(emprestimos: Emprestimo[]): void {
    if (emprestimos.length === 0) {
      this.cli.writeLine('Nenhum emprestimo encontrado.')
      return
    }

    emprestimos.forEach((emprestimo) => {
      this.cli.writeLine(
        `${String(emprestimo.id)} | ${emprestimo.livroTitulo} | ${emprestimo.clienteNome} | ${this.formatData(emprestimo.dataEmprestimo)} | ${emprestimo.status}`
      )
    })
  }

  private showEmprestimoDetalhado(emprestimo: Emprestimo): void {
    this.cli.writeLine(`ID: ${String(emprestimo.id)}`)
    this.cli.writeLine(`Livro: ${emprestimo.livroTitulo}`)
    this.cli.writeLine(`Cliente: ${emprestimo.clienteNome}`)
    this.cli.writeLine(
      `Funcionario: ${emprestimo.funcionarioNome ?? 'Nao informado'}`
    )
    this.cli.writeLine(
      `Data do emprestimo: ${this.formatData(emprestimo.dataEmprestimo)}`
    )
    this.cli.writeLine(
      `Devolucao prevista: ${emprestimo.dataPrevistaDevolucao}`
    )
    this.cli.writeLine(
      `Data da devolucao: ${emprestimo.dataDevolucao === null ? 'Em aberto' : this.formatData(emprestimo.dataDevolucao)}`
    )
    this.cli.writeLine(`Status: ${emprestimo.status}`)
    this.cli.writeLine(`Observacao: ${emprestimo.observacao ?? 'Nenhuma'}`)
  }

  private formatData(data: Date): string {
    return data.toISOString().slice(0, 10)
  }

  private async askId(message: string): Promise<number> {
    const value = await this.cli.ask(message)

    return parsePositiveInteger(value, 'ID')
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
