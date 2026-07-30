export interface Autor {
  id: number
  nome: string
  nacionalidade: string | null
  dataNascimento: string | null
  biografia: string | null
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface AutorRow {
  id: number
  nome: string
  nacionalidade: string | null
  data_nascimento: string | null
  biografia: string | null
  ativo: boolean
  criado_em: Date
  atualizado_em: Date
}

export interface CriarAutorInput {
  nome: string
  nacionalidade?: string
  dataNascimento?: string
  biografia?: string
}

export interface AtualizarAutorInput {
  nome?: string
  nacionalidade?: string
  dataNascimento?: string
  biografia?: string
}

export interface SalvarAutorData {
  nome: string
  nacionalidade: string | null
  dataNascimento: string | null
  biografia: string | null
}

export class AutorModel {
  static fromRow(row: AutorRow): Autor {
    return {
      id: row.id,
      nome: row.nome,
      nacionalidade: row.nacionalidade,
      dataNascimento: row.data_nascimento,
      biografia: row.biografia,
      ativo: row.ativo,
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em
    }
  }
}
