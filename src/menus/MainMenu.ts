import { AutorMenu } from './AutorMenu'
import { ClienteMenu } from './ClienteMenu'
import { EmprestimoMenu } from './EmprestimoMenu'
import { FuncionarioMenu } from './FuncionarioMenu'
import { LivroMenu } from './LivroMenu'
import { Cli } from '../utils/Cli'

export class MainMenu {
  constructor(
    private readonly cli: Cli,
    private readonly autorMenu: AutorMenu,
    private readonly livroMenu: LivroMenu,
    private readonly clienteMenu: ClienteMenu,
    private readonly emprestimoMenu: EmprestimoMenu,
    private readonly funcionarioMenu: FuncionarioMenu
  ) {}

  async start(): Promise<void> {
    let running = true

    while (running) {
      this.cli.clear()
      this.cli.writeLine('========================================')
      this.cli.writeLine('       BookStore Manager CLI')
      this.cli.writeLine('========================================')
      this.cli.writeLine('1. Autores')
      this.cli.writeLine('2. Livros')
      this.cli.writeLine('3. Clientes')
      this.cli.writeLine('4. Emprestimos')
      this.cli.writeLine('5. Funcionarios')
      this.cli.writeLine('6. Relatorios')
      this.cli.writeLine('0. Encerrar aplicacao')

      const option = await this.cli.ask('Escolha uma opcao: ')

      switch (option) {
        case '1':
          await this.autorMenu.start()
          break
        case '2':
          await this.livroMenu.start()
          break
        case '3':
          await this.clienteMenu.start()
          break
        case '4':
          await this.emprestimoMenu.start()
          break
        case '5':
          await this.funcionarioMenu.start()
          break
        case '6':
          this.cli.writeLine('Funcionalidade em desenvolvimento nesta etapa.')
          await this.cli.pause()
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
