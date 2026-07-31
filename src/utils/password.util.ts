import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

import { DomainError } from './DomainError'

const KEY_LENGTH = 64
const SALT_BYTES = 16
const SENHA_MINIMA = 6

/**
 * Deriva a senha com scrypt do modulo nativo `node:crypto`, sem dependencia
 * externa. O salt aleatorio garante que duas senhas iguais gerem hashes
 * diferentes, e o formato guardado e `salt:hash` em hexadecimal.
 */
export function hashSenha(senha: string | undefined): string {
  const normalized = senha?.trim() ?? ''

  if (normalized.length < SENHA_MINIMA) {
    throw new DomainError(
      `Senha deve ter pelo menos ${String(SENHA_MINIMA)} caracteres.`
    )
  }

  const salt = randomBytes(SALT_BYTES).toString('hex')
  const hash = scryptSync(normalized, salt, KEY_LENGTH).toString('hex')

  return `${salt}:${hash}`
}

/**
 * Comparacao em tempo constante: um `===` vazaria informacao pelo tempo de
 * resposta, permitindo descobrir o hash caractere a caractere.
 */
export function verificarSenha(senha: string, senhaHash: string): boolean {
  const [salt, hash] = senhaHash.split(':')

  if (!salt || !hash) {
    return false
  }

  const esperado = Buffer.from(hash, 'hex')
  const informado = scryptSync(senha, salt, esperado.length)

  return timingSafeEqual(esperado, informado)
}
