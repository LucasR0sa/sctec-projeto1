import 'dotenv/config'

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { closeDatabaseConnection, pool } from './connection'

/**
 * Executa um arquivo .sql inteiro em uma unica chamada, preservando os blocos
 * BEGIN/COMMIT e o dollar-quoting das funcoes PL/pgSQL. Torna schema e seed
 * reprodutiveis por comando, sem depender de passos manuais no DBeaver.
 */
async function runSqlFile(relativePath: string): Promise<void> {
  const absolutePath = resolve(process.cwd(), relativePath)
  const sql = await readFile(absolutePath, 'utf8')

  await pool.query(sql)
}

async function main(): Promise<void> {
  const [, , ...files] = process.argv

  if (files.length === 0) {
    throw new Error('Informe ao menos um arquivo .sql para executar.')
  }

  try {
    for (const file of files) {
      console.log(`Executando ${file}...`)
      await runSqlFile(file)
      console.log(`${file} executado com sucesso.`)
    }
  } finally {
    await closeDatabaseConnection()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
