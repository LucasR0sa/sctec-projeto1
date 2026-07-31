import { EmprestimoController } from '../controllers/EmprestimoController'
import { Cli } from '../utils/Cli'

export class EmprestimoMenu {
  constructor(
    private readonly cli: Cli,
    private readonly emprestimoController: EmprestimoController
  ) {}

  async start(): Promise<void> {
    let running = true

    while (running) {
      this.cli.clear()
      this.cli.writeLine('=== Emprestimos ===')
      this.cli.writeLine('1. Registrar emprestimo')
      this.cli.writeLine('2. Registrar devolucao')
      this.cli.writeLine('3. Listar emprestimos em aberto')
      this.cli.writeLine('4. Listar todos os emprestimos')
      this.cli.writeLine('5. Consultar emprestimo por ID')
      this.cli.writeLine('0. Voltar')

      const option = await this.cli.ask('Escolha uma opcao: ')

      switch (option) {
        case '1':
          await this.emprestimoController.registrar()
          break
        case '2':
          await this.emprestimoController.registrarDevolucao()
          break
        case '3':
          await this.emprestimoController.listarPendentes()
          break
        case '4':
          await this.emprestimoController.listar()
          break
        case '5':
          await this.emprestimoController.consultar()
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
