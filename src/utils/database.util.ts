const UNIQUE_VIOLATION_CODE = '23505'

interface PostgresError {
  code?: unknown
  constraint?: unknown
}

export function isUniqueViolation(
  error: unknown,
  constraintName: string
): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const { code, constraint } = error as PostgresError

  return code === UNIQUE_VIOLATION_CODE && constraint === constraintName
}
