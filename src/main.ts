import 'dotenv/config'

import { AutorController } from './controllers/AutorController'
import {
  closeDatabaseConnection,
  pool,
  testDatabaseConnection
} from './database/connection'
import { AutorMenu } from './menus/AutorMenu'
import { MainMenu } from './menus/MainMenu'
import { AutorRepository } from './repositories/AutorRepository'
import { AutorService } from './services/AutorService'
import { Cli } from './utils/Cli'

async function bootstrap(): Promise<void> {
  const cli = new Cli()

  try {
    await testDatabaseConnection()

    const autorRepository = new AutorRepository(pool)
    const autorService = new AutorService(autorRepository)
    const autorController = new AutorController(cli, autorService)
    const autorMenu = new AutorMenu(cli, autorController)
    const mainMenu = new MainMenu(cli, autorMenu)

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
