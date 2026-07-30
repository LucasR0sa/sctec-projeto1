import { DomainError } from './DomainError'

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export function normalizeOptionalText(value?: string): string | null {
  if (!value) {
    return null
  }

  const normalized = normalizeText(value)

  return normalized.length > 0 ? normalized : null
}

export function requireMinText(
  value: string | undefined,
  fieldName: string,
  minLength: number
): string {
  const normalized = normalizeOptionalText(value)

  if (!normalized || normalized.length < minLength) {
    throw new DomainError(
      `${fieldName} deve ter pelo menos ${String(minLength)} caracteres.`
    )
  }

  return normalized
}

export function parseOptionalDate(value?: string): string | null {
  const normalized = normalizeOptionalText(value)

  if (!normalized) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new DomainError('Data invalida. Use o formato AAAA-MM-DD.')
  }

  const date = new Date(`${normalized}T00:00:00.000Z`)

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
  ) {
    throw new DomainError('Data invalida. Use o formato AAAA-MM-DD.')
  }

  return normalized
}

export function parsePositiveInteger(value: string, fieldName: string): number {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new DomainError(`${fieldName} deve ser um numero inteiro positivo.`)
  }

  return parsed
}
