import { FuncionarioController } from '../controllers/FuncionarioController'
import { Cli } from '../utils/Cli'

export class FuncionarioMenu {
  constructor(
    private readonly cli: Cli,
    private readonly funcionarioController: FuncionarioController
  ) {}

  async start(): Promise<void> {
    let running = true

    while (running) {
      this.cli.clear()
      this.cli.writeLine('=== Funcionarios ===')
      this.cli.writeLine('1. Cadastrar funcionario')
      this.cli.writeLine('2. Listar funcionarios')
      this.cli.writeLine('3. Consultar funcionario por ID')
      this.cli.writeLine('4. Atualizar funcionario')
      this.cli.writeLine('5. Remover funcionario')
      this.cli.writeLine('0. Voltar')

      const option = await this.cli.ask('Escolha uma opcao: ')

      switch (option) {
        case '1':
          await this.funcionarioController.cadastrar()
          break
        case '2':
          await this.funcionarioController.listar()
          break
        case '3':
          await this.funcionarioController.consultar()
          break
        case '4':
          await this.funcionarioController.atualizar()
          break
        case '5':
          await this.funcionarioController.remover()
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
