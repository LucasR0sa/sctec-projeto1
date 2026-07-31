export interface Livro {
  id: number
  titulo: string
  isbn: string
  editora: string | null
  categoria: string | null
  anoPublicacao: number | null
  quantidadeTotal: number
  quantidadeDisponivel: number
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
  autorIds: number[]
  autores: string[]
}

export interface LivroRow {
  id: number
  titulo: string
  isbn: string
  editora: string | null
  categoria: string | null
  ano_publicacao: number | null
  quantidade_total: number
  quantidade_disponivel: number
  ativo: boolean
  criado_em: Date
  atualizado_em: Date
  autor_ids: number[] | null
  autores: string[] | null
}

export interface CriarLivroInput {
  titulo: string
  isbn: string
  editora?: string
  categoria?: string
  anoPublicacao?: string
  quantidadeTotal: string
  autorIds: string
}

export interface AtualizarLivroInput {
  titulo?: string
  isbn?: string
  editora?: string
  categoria?: string
  anoPublicacao?: string
  quantidadeTotal?: string
  autorIds?: string
}

export interface SalvarLivroData {
  titulo: string
  isbn: string
  editora: string | null
  categoria: string | null
  anoPublicacao: number | null
  quantidadeTotal: number
  quantidadeDisponivel: number
}

export class LivroModel {
  static fromRow(row: LivroRow): Livro {
    return {
      id: row.id,
      titulo: row.titulo,
      isbn: row.isbn,
      editora: row.editora,
      categoria: row.categoria,
      anoPublicacao: row.ano_publicacao,
      quantidadeTotal: row.quantidade_total,
      quantidadeDisponivel: row.quantidade_disponivel,
      ativo: row.ativo,
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
      autorIds: row.autor_ids ?? [],
      autores: row.autores ?? []
    }
  }
}
