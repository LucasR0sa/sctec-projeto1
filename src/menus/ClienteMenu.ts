import { ClienteController } from '../controllers/ClienteController'
import { Cli } from '../utils/Cli'

export class ClienteMenu {
  constructor(
    private readonly cli: Cli,
    private readonly clienteController: ClienteController
  ) {}

  async start(): Promise<void> {
    let running = true

    while (running) {
      this.cli.clear()
      this.cli.writeLine('=== Clientes ===')
      this.cli.writeLine('1. Cadastrar cliente')
      this.cli.writeLine('2. Listar clientes')
      this.cli.writeLine('3. Consultar cliente por ID')
      this.cli.writeLine('4. Atualizar cliente')
      this.cli.writeLine('5. Remover cliente')
      this.cli.writeLine('0. Voltar')

      const option = await this.cli.ask('Escolha uma opcao: ')

      switch (option) {
        case '1':
          await this.clienteController.cadastrar()
          break
        case '2':
          await this.clienteController.listar()
          break
        case '3':
          await this.clienteController.consultar()
          break
        case '4':
          await this.clienteController.atualizar()
          break
        case '5':
          await this.clienteController.remover()
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
