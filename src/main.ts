import 'dotenv/config'

import { AutorController } from './controllers/AutorController'
import { LivroController } from './controllers/LivroController'
import {
  closeDatabaseConnection,
  pool,
  testDatabaseConnection
} from './database/connection'
import { AutorMenu } from './menus/AutorMenu'
import { LivroMenu } from './menus/LivroMenu'
import { MainMenu } from './menus/MainMenu'
import { AutorRepository } from './repositories/AutorRepository'
import { LivroRepository } from './repositories/LivroRepository'
import { AutorService } from './services/AutorService'
import { LivroService } from './services/LivroService'
import { Cli } from './utils/Cli'

async function bootstrap(): Promise<void> {
  const cli = new Cli()

  try {
    await testDatabaseConnection()

    const autorRepository = new AutorRepository(pool)
    const livroRepository = new LivroRepository(pool)

    const autorService = new AutorService(autorRepository)
    const livroService = new LivroService(livroRepository, autorRepository)

    const autorController = new AutorController(cli, autorService)
    const livroController = new LivroController(cli, livroService)

    const autorMenu = new AutorMenu(cli, autorController)
    const livroMenu = new LivroMenu(cli, livroController)
    const mainMenu = new MainMenu(cli, autorMenu, livroMenu)

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
