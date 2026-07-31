import { Pool } from 'pg'

import {
  CategoriaResumoRow,
  ClienteComEmprestimoRow,
  EmprestimoPorLivroRow,
  LivroDisponivelRow,
  LivroEmprestadoRow,
  LivroPorAutorRow
} from '../models/Relatorio'

/**
 * Os cinco primeiros relatorios consultam views declaradas no schema.sql.
 * Manter a consulta relacional no banco deixa a regra reaproveitavel por
 * qualquer cliente (CLI, BI, outra aplicacao) e nao so por esta aplicacao.
 */
export class RelatorioRepository {
  constructor(private readonly pool: Pool) {}

  async livrosDisponiveis(): Promise<LivroDisponivelRow[]> {
    const { rows } = await this.pool.query<LivroDisponivelRow>(
      `SELECT id, titulo, isbn, quantidade_total, quantidade_disponivel, autores
       FROM vw_livros_disponiveis
       ORDER BY titulo ASC`
    )

    return rows
  }

  async livrosEmprestados(): Promise<LivroEmprestadoRow[]> {
    const { rows } = await this.pool.query<LivroEmprestadoRow>(
      `SELECT emprestimo_id, livro, cliente, funcionario,
              data_emprestimo, data_prevista_devolucao, status
       FROM vw_livros_emprestados`
    )

    return rows
  }

  async livrosPorAutor(): Promise<LivroPorAutorRow[]> {
    const { rows } = await this.pool.query<LivroPorAutorRow>(
      `SELECT autor_id, autor, total_livros, livros
       FROM vw_livros_por_autor`
    )

    return rows
  }

  async emprestimosPorLivro(): Promise<EmprestimoPorLivroRow[]> {
    const { rows } = await this.pool.query<EmprestimoPorLivroRow>(
      `SELECT livro_id, titulo, total_emprestimos, emprestimos_ativos
       FROM vw_emprestimos_por_livro`
    )

    return rows
  }

  async clientesComEmprestimosAtivos(): Promise<ClienteComEmprestimoRow[]> {
    const { rows } = await this.pool.query<ClienteComEmprestimoRow>(
      `SELECT cliente_id, cliente, email,
              total_emprestimos_ativos, livros_emprestados
       FROM vw_clientes_com_emprestimos_ativos`
    )

    return rows
  }

  /**
   * Relatorio adicional montado direto na aplicacao, para demonstrar
   * GROUP BY, funcoes de agregacao, ORDER BY e LIMIT em uma consulta so.
   */
  async topCategorias(limite: number): Promise<CategoriaResumoRow[]> {
    const { rows } = await this.pool.query<CategoriaResumoRow>(
      `SELECT COALESCE(l.categoria, 'Sem categoria') AS categoria,
              COUNT(*) AS total_titulos,
              SUM(l.quantidade_total) AS exemplares_totais,
              SUM(l.quantidade_disponivel) AS exemplares_disponiveis
       FROM livros l
       WHERE l.ativo = TRUE
       GROUP BY COALESCE(l.categoria, 'Sem categoria')
       ORDER BY exemplares_totais DESC, categoria ASC
       LIMIT $1`,
      [limite]
    )

    return rows
  }
}
