import { LivroController } from '../controllers/LivroController'
import { Cli } from '../utils/Cli'

export class LivroMenu {
  constructor(
    private readonly cli: Cli,
    private readonly livroController: LivroController
  ) {}

  async start(): Promise<void> {
    let running = true

    while (running) {
      this.cli.clear()
      this.cli.writeLine('=== Livros ===')
      this.cli.writeLine('1. Cadastrar livro')
      this.cli.writeLine('2. Listar livros')
      this.cli.writeLine('3. Consultar livro por ID')
      this.cli.writeLine('4. Atualizar livro')
      this.cli.writeLine('5. Remover livro')
      this.cli.writeLine('0. Voltar')

      const option = await this.cli.ask('Escolha uma opcao: ')

      switch (option) {
        case '1':
          await this.livroController.cadastrar()
          break
        case '2':
          await this.livroController.listar()
          break
        case '3':
          await this.livroController.consultar()
          break
        case '4':
          await this.livroController.atualizar()
          break
        case '5':
          await this.livroController.remover()
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
