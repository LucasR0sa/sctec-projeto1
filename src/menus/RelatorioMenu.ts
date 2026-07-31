import { RelatorioController } from '../controllers/RelatorioController'
import { Cli } from '../utils/Cli'

export class RelatorioMenu {
  constructor(
    private readonly cli: Cli,
    private readonly relatorioController: RelatorioController
  ) {}

  async start(): Promise<void> {
    let running = true

    while (running) {
      this.cli.clear()
      this.cli.writeLine('=== Relatorios ===')
      this.cli.writeLine('1. Livros disponiveis')
      this.cli.writeLine('2. Livros emprestados')
      this.cli.writeLine('3. Livros cadastrados por autor')
      this.cli.writeLine('4. Quantidade de emprestimos por livro')
      this.cli.writeLine('5. Clientes com emprestimos ativos')
      this.cli.writeLine('6. Top 5 categorias do acervo')
      this.cli.writeLine('0. Voltar')

      const option = await this.cli.ask('Escolha uma opcao: ')

      switch (option) {
        case '1':
          await this.relatorioController.livrosDisponiveis()
          break
        case '2':
          await this.relatorioController.livrosEmprestados()
          break
        case '3':
          await this.relatorioController.livrosPorAutor()
          break
        case '4':
          await this.relatorioController.emprestimosPorLivro()
          break
        case '5':
          await this.relatorioController.clientesComEmprestimosAtivos()
          break
        case '6':
          await this.relatorioController.topCategorias()
          break
        case '0':
          running = false
          break
        default:
          this.cli.writeLine('Opcao invalida.')
          await this.cli.pause()
      }
    }
  }
}
