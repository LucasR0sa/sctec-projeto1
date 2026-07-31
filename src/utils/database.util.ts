const UNIQUE_VIOLATION_CODE = '23505'
const FOREIGN_KEY_VIOLATION_CODE = '23503'

interface PostgresError {
  code?: unknown
  constraint?: unknown
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
