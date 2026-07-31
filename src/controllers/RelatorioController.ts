import { RelatorioService } from '../services/RelatorioService'
import { Cli, CliClosedError } from '../utils/Cli'
import { DomainError } from '../utils/DomainError'

export class RelatorioController {
  constructor(
    private readonly cli: Cli,
    private readonly relatorioService: RelatorioService
  ) {}

  async livrosDisponiveis(): Promise<void> {
    await this.render('Livros disponiveis', async () => {
      const linhas = await this.relatorioService.livrosDisponiveis()

      return linhas.map(
        (l) =>
          `${String(l.id)} | ${l.titulo} | ${l.autores} | ${String(l.quantidade_disponivel)} de ${String(l.quantidade_total)} disponiveis`
      )
    })
  }

  async livrosEmprestados(): Promise<void> {
    await this.render('Livros emprestados', async () => {
      const linhas = await this.relatorioService.livrosEmprestados()

      return linhas.map(
        (l) =>
          `${String(l.emprestimo_id)} | ${l.livro} | ${l.cliente} | saida ${this.formatData(l.data_emprestimo)} | prevista ${l.data_prevista_devolucao} | ${l.status}`
      )
    })
  }

  async livrosPorAutor(): Promise<void> {
    await this.render('Livros cadastrados por autor', async () => {
      const linhas = await this.relatorioService.livrosPorAutor()

      return linhas.map(
        (l) =>
          `${l.autor} | ${l.total_livros} livro(s) | ${l.livros ?? 'Nenhum livro vinculado'}`
      )
    })
  }

  async emprestimosPorLivro(): Promise<void> {
    await this.render('Quantidade de emprestimos por livro', async () => {
      const linhas = await this.relatorioService.emprestimosPorLivro()

      return linhas.map(
        (l) =>
          `${l.titulo} | ${l.total_emprestimos} no total | ${l.emprestimos_ativos} em aberto`
      )
    })
  }

  async clientesComEmprestimosAtivos(): Promise<void> {
    await this.render('Clientes com emprestimos ativos', async () => {
      const linhas = await this.relatorioService.clientesComEmprestimosAtivos()

      return linhas.map(
        (l) =>
          `${l.cliente} | ${l.email} | ${l.total_emprestimos_ativos} em aberto | ${l.livros_emprestados}`
      )
    })
  }

  async topCategorias(): Promise<void> {
    await this.render('Top 5 categorias do acervo', async () => {
      const linhas = await this.relatorioService.topCategorias()

      return linhas.map(
        (l) =>
          `${l.categoria} | ${l.total_titulos} titulo(s) | ${l.exemplares_disponiveis} de ${l.exemplares_totais} exemplares disponiveis`
      )
    })
  }

  private async render(
    titulo: string,
    carregar: () => Promise<string[]>
  ): Promise<void> {
    try {
      this.cli.writeLine(`=== ${titulo} ===`)

      const linhas = await carregar()

      if (linhas.length === 0) {
        this.cli.writeLine('Nenhum registro encontrado.')
      } else {
        linhas.forEach((linha) => {
          this.cli.writeLine(linha)
        })
      }
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  private formatData(data: Date): string {
    return data.toISOString().slice(0, 10)
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
