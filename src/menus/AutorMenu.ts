import { AutorController } from '../controllers/AutorController'
import { Cli } from '../utils/Cli'

export class AutorMenu {
  constructor(
    private readonly cli: Cli,
    private readonly autorController: AutorController
  ) {}

  async start(): Promise<void> {
    let running = true

    while (running) {
      this.cli.clear()
      this.cli.writeLine('=== Autores ===')
      this.cli.writeLine('1. Cadastrar autor')
      this.cli.writeLine('2. Listar autores')
      this.cli.writeLine('3. Consultar autor por ID')
      this.cli.writeLine('4. Atualizar autor')
      this.cli.writeLine('5. Remover autor')
      this.cli.writeLine('0. Voltar')

      const option = await this.cli.ask('Escolha uma opcao: ')

      switch (option) {
        case '1':
          await this.autorController.cadastrar()
          break
        case '2':
          await this.autorController.listar()
          break
        case '3':
          await this.autorController.consultar()
          break
        case '4':
          await this.autorController.atualizar()
          break
        case '5':
          await this.autorController.remover()
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
