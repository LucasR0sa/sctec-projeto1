import 'dotenv/config'

import { AutorController } from './controllers/AutorController'
import { ClienteController } from './controllers/ClienteController'
import { EmprestimoController } from './controllers/EmprestimoController'
import { FuncionarioController } from './controllers/FuncionarioController'
import { LivroController } from './controllers/LivroController'
import { RelatorioController } from './controllers/RelatorioController'
import {
  closeDatabaseConnection,
  pool,
  testDatabaseConnection
} from './database/connection'
import { AutorMenu } from './menus/AutorMenu'
import { ClienteMenu } from './menus/ClienteMenu'
import { EmprestimoMenu } from './menus/EmprestimoMenu'
import { FuncionarioMenu } from './menus/FuncionarioMenu'
import { LivroMenu } from './menus/LivroMenu'
import { MainMenu } from './menus/MainMenu'
import { RelatorioMenu } from './menus/RelatorioMenu'
import { AutorRepository } from './repositories/AutorRepository'
import { ClienteRepository } from './repositories/ClienteRepository'
import { EmprestimoRepository } from './repositories/EmprestimoRepository'
import { FuncionarioRepository } from './repositories/FuncionarioRepository'
import { LivroRepository } from './repositories/LivroRepository'
import { RelatorioRepository } from './repositories/RelatorioRepository'
import { AutorService } from './services/AutorService'
import { ClienteService } from './services/ClienteService'
import { EmprestimoService } from './services/EmprestimoService'
import { FuncionarioService } from './services/FuncionarioService'
import { LivroService } from './services/LivroService'
import { RelatorioService } from './services/RelatorioService'
import { Cli, CliClosedError } from './utils/Cli'

async function bootstrap(): Promise<void> {
  const cli = new Cli()

  try {
    await testDatabaseConnection()

    const autorRepository = new AutorRepository(pool)
    const livroRepository = new LivroRepository(pool)
    const clienteRepository = new ClienteRepository(pool)
    const emprestimoRepository = new EmprestimoRepository(pool)
    const funcionarioRepository = new FuncionarioRepository(pool)
    const relatorioRepository = new RelatorioRepository(pool)

    const autorService = new AutorService(autorRepository)
    const livroService = new LivroService(livroRepository, autorRepository)
    const clienteService = new ClienteService(clienteRepository)
    const emprestimoService = new EmprestimoService(
      emprestimoRepository,
      livroRepository,
      clienteRepository
    )
    const funcionarioService = new FuncionarioService(funcionarioRepository)
    const relatorioService = new RelatorioService(
      relatorioRepository,
      emprestimoRepository
    )

    const autorController = new AutorController(cli, autorService)
    const livroController = new LivroController(cli, livroService)
    const clienteController = new ClienteController(cli, clienteService)
    const emprestimoController = new EmprestimoController(
      cli,
      emprestimoService
    )
    const funcionarioController = new FuncionarioController(
      cli,
      funcionarioService
    )
    const relatorioController = new RelatorioController(cli, relatorioService)

    const autorMenu = new AutorMenu(cli, autorController)
    const livroMenu = new LivroMenu(cli, livroController)
    const clienteMenu = new ClienteMenu(cli, clienteController)
    const emprestimoMenu = new EmprestimoMenu(cli, emprestimoController)
    const funcionarioMenu = new FuncionarioMenu(cli, funcionarioController)
    const relatorioMenu = new RelatorioMenu(cli, relatorioController)

    const mainMenu = new MainMenu(
      cli,
      autorMenu,
      livroMenu,
      clienteMenu,
      emprestimoMenu,
      funcionarioMenu,
      relatorioMenu
    )

    try {
      await mainMenu.start()
    } catch (error) {
      if (!(error instanceof CliClosedError)) {
        throw error
      }

      console.log('\nEntrada encerrada. Finalizando a aplicacao.')
    }
  } finally {
    cli.close()
    await closeDatabaseConnection()
  }
}

bootstrap()
  .then(() => {
    process.exitCode = 0
  })
  .catch((error: unknown) => {
    console.log('Erro fatal ao executar a aplicacao.')
    console.error(error)
    process.exitCode = 1
  })
