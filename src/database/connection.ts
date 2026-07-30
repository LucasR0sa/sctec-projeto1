import { Pool } from 'pg'

function getRequiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria nao configurada: ${name}`)
  }

  return value
}

function getDatabasePort(): number {
  const rawPort = process.env.DB_PORT ?? '5432'
  const port = Number(rawPort)

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('DB_PORT deve ser um numero inteiro positivo.')
  }

  return port
}

export const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: getDatabasePort(),
  database: getRequiredEnv('DB_NAME'),
  user: getRequiredEnv('DB_USER'),
  password: getRequiredEnv('DB_PASSWORD'),
  max: 10,
  idleTimeoutMillis: 30000
})

export async function testDatabaseConnection(): Promise<void> {
  await pool.query('SELECT 1')
}

export async function closeDatabaseConnection(): Promise<void> {
  await pool.end()
}
