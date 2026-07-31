export interface Funcionario {
  id: number
  nome: string
  matricula: string
  email: string
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface FuncionarioRow {
  id: number
  nome: string
  matricula: string
  email: string
  ativo: boolean
  criado_em: Date
  atualizado_em: Date
}

export interface CriarFuncionarioInput {
  nome: string
  matricula: string
  email: string
  senha: string
}

export interface AtualizarFuncionarioInput {
  nome?: string
  matricula?: string
  email?: string
  senha?: string
}

export interface SalvarFuncionarioData {
  nome: string
  matricula: string
  email: string
  senhaHash: string | null
}

export class FuncionarioModel {
  static fromRow(row: FuncionarioRow): Funcionario {
    return {
      id: row.id,
      nome: row.nome,
      matricula: row.matricula,
      email: row.email,
      ativo: row.ativo,
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em
    }
  }
}
