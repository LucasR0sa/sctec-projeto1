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
  const normalized = value.trim()

  // Number() aceitaria '0x10', '1e3' e '+7' como IDs validos.
  if (!/^\d+$/.test(normalized)) {
    throw new DomainError(`${fieldName} deve ser um numero inteiro positivo.`)
  }

  const parsed = Number(normalized)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new DomainError(`${fieldName} deve ser um numero inteiro positivo.`)
  }

  return parsed
}

export function parseIntegerInRange(
  value: string,
  fieldName: string,
  min: number,
  max: number
): number {
  const parsed = parsePositiveInteger(value, fieldName)

  if (parsed < min || parsed > max) {
    throw new DomainError(
      `${fieldName} deve estar entre ${String(min)} e ${String(max)}.`
    )
  }

  return parsed
}

export function parseOptionalIntegerInRange(
  value: string | undefined,
  fieldName: string,
  min: number,
  max: number
): number | null {
  const normalized = normalizeOptionalText(value)

  if (!normalized) {
    return null
  }

  return parseIntegerInRange(normalized, fieldName, min, max)
}

export function parseIsbn(value: string | undefined): string {
  const normalized = normalizeOptionalText(value)

  if (!normalized) {
    throw new DomainError('ISBN e obrigatorio.')
  }

  const digits = normalized.replace(/\D/g, '')

  if (digits.length !== 10 && digits.length !== 13) {
    throw new DomainError('ISBN deve ter 10 ou 13 digitos.')
  }

  return normalized
}

export function parseIdList(
  value: string | undefined,
  fieldName: string
): number[] {
  const normalized = normalizeOptionalText(value)

  if (!normalized) {
    throw new DomainError(`${fieldName} e obrigatorio.`)
  }

  const ids = normalized
    .split(',')
    .map((part) => parsePositiveInteger(part, fieldName))

  return [...new Set(ids)]
}
