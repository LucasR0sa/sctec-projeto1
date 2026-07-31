export interface LivroDisponivelRow {
  id: number
  titulo: string
  isbn: string
  quantidade_total: number
  quantidade_disponivel: number
  autores: string
}

export interface LivroEmprestadoRow {
  emprestimo_id: number
  livro: string
  cliente: string
  funcionario: string | null
  data_emprestimo: Date
  data_prevista_devolucao: string
  status: string
}

export interface LivroPorAutorRow {
  autor_id: number
  autor: string
  total_livros: string
  livros: string | null
}

export interface EmprestimoPorLivroRow {
  livro_id: number
  titulo: string
  total_emprestimos: string
  emprestimos_ativos: string
}

export interface ClienteComEmprestimoRow {
  cliente_id: number
  cliente: string
  email: string
  total_emprestimos_ativos: string
  livros_emprestados: string
}

export interface CategoriaResumoRow {
  categoria: string
  total_titulos: string
  exemplares_totais: string
  exemplares_disponiveis: string
}
