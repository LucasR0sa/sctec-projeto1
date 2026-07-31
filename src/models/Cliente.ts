export interface Cliente {
  id: number
  nome: string
  email: string
  telefone: string | null
  documento: string | null
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface ClienteRow {
  id: number
  nome: string
  email: string
  telefone: string | null
  documento: string | null
  ativo: boolean
  criado_em: Date
  atualizado_em: Date
}

export interface CriarClienteInput {
  nome: string
  email: string
  telefone?: string
  documento?: string
}

export interface AtualizarClienteInput {
  nome?: string
  email?: string
  telefone?: string
  documento?: string
}

export interface SalvarClienteData {
  nome: string
  email: string
  telefone: string | null
  documento: string | null
}

export class ClienteModel {
  static fromRow(row: ClienteRow): Cliente {
    return {
      id: row.id,
      nome: row.nome,
      email: row.email,
      telefone: row.telefone,
      documento: row.documento,
      ativo: row.ativo,
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em
    }
  }
}
