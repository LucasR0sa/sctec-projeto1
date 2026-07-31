const UNIQUE_VIOLATION_CODE = '23505'
const FOREIGN_KEY_VIOLATION_CODE = '23503'
const RAISE_EXCEPTION_CODE = 'P0001'

interface PostgresError {
  code?: unknown
  constraint?: unknown
  message?: unknown
}

/**
 * Mensagem de um RAISE EXCEPTION disparado por trigger ou funcao PL/pgSQL.
 * Essas regras vivem no banco, entao a aplicacao precisa reconhece-las como
 * erro de negocio e nao como falha tecnica.
 */
export function getRaisedExceptionMessage(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) {
    return null
  }

  const { code, message } = error as PostgresError

  if (code !== RAISE_EXCEPTION_CODE || typeof message !== 'string') {
    return null
  }

  return message
}

function matchesConstraint(
  error: unknown,
  expectedCode: string,
  constraintName: string
): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const { code, constraint } = error as PostgresError

  return code === expectedCode && constraint === constraintName
}

export function isUniqueViolation(
  error: unknown,
  constraintName: string
): boolean {
  return matchesConstraint(error, UNIQUE_VIOLATION_CODE, constraintName)
}

export function isForeignKeyViolation(
  error: unknown,
  constraintName: string
): boolean {
  return matchesConstraint(error, FOREIGN_KEY_VIOLATION_CODE, constraintName)
}
