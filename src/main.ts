import 'dotenv/config'

import { AutorController } from './controllers/AutorController'
import { ClienteController } from './controllers/ClienteController'
import { EmprestimoController } from './controllers/EmprestimoController'
import { LivroController } from './controllers/LivroController'
import {
  closeDatabaseConnection,
  pool,
  testDatabaseConnection
} from './database/connection'
import { AutorMenu } from './menus/AutorMenu'
import { ClienteMenu } from './menus/ClienteMenu'
import { EmprestimoMenu } from './menus/EmprestimoMenu'
import { LivroMenu } from './menus/LivroMenu'
import { MainMenu } from './menus/MainMenu'
import { AutorRepository } from './repositories/AutorRepository'
import { ClienteRepository } from './repositories/ClienteRepository'
import { EmprestimoRepository } from './repositories/EmprestimoRepository'
import { LivroRepository } from './repositories/LivroRepository'
import { AutorService } from './services/AutorService'
import { ClienteService } from './services/ClienteService'
import { EmprestimoService } from './services/EmprestimoService'
import { LivroService } from './services/LivroService'
import { Cli } from './utils/Cli'

async function bootstrap(): Promise<void> {
  const cli = new Cli()

  try {
    await testDatabaseConnection()

    const autorRepository = new AutorRepository(pool)
    const livroRepository = new LivroRepository(pool)
    const clienteRepository = new ClienteRepository(pool)
    const emprestimoRepository = new EmprestimoRepository(pool)

    const autorService = new AutorService(autorRepository)
    const livroService = new LivroService(livroRepository, autorRepository)
    const clienteService = new ClienteService(clienteRepository)
    const emprestimoService = new EmprestimoService(
      emprestimoRepository,
      livroRepository,
      clienteRepository
    )

    const autorController = new AutorController(cli, autorService)
    const livroController = new LivroController(cli, livroService)
    const clienteController = new ClienteController(cli, clienteService)
    const emprestimoController = new EmprestimoController(
      cli,
      emprestimoService
    )

    const autorMenu = new AutorMenu(cli, autorController)
    const livroMenu = new LivroMenu(cli, livroController)
    const clienteMenu = new ClienteMenu(cli, clienteController)
    const emprestimoMenu = new EmprestimoMenu(cli, emprestimoController)
    const mainMenu = new MainMenu(
      cli,
      autorMenu,
      livroMenu,
      clienteMenu,
      emprestimoMenu
    )

    await mainMenu.start()
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
