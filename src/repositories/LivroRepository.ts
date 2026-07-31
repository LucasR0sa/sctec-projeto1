import { Pool, PoolClient } from 'pg'

import { Livro, LivroModel, LivroRow, SalvarLivroData } from '../models/Livro'

type QueryExecutor = Pool | PoolClient

const LIVRO_COLUMNS = `
  l.id,
  l.titulo,
  l.isbn,
  l.editora,
  l.categoria,
  l.ano_publicacao,
  l.quantidade_total,
  l.quantidade_disponivel,
  l.ativo,
  l.criado_em,
  l.atualizado_em,
  COALESCE(
    ARRAY_AGG(a.id ORDER BY a.nome) FILTER (WHERE a.id IS NOT NULL),
    '{}'
  ) AS autor_ids,
  COALESCE(
    ARRAY_AGG(a.nome ORDER BY a.nome) FILTER (WHERE a.id IS NOT NULL),
    '{}'
  ) AS autores
`

const LIVRO_JOINS = `
  FROM livros l
  LEFT JOIN livro_autor la ON la.livro_id = l.id
  LEFT JOIN autores a ON a.id = la.autor_id
`

export class LivroRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: SalvarLivroData, autorIds: number[]): Promise<Livro> {
    return await this.runInTransaction(async (client) => {
      const {
        rows: [row]
      } = await client.query<{ id: number }>(
        `INSERT INTO livros (
           titulo,
           isbn,
           editora,
           categoria,
           ano_publicacao,
           quantidade_total,
           quantidade_disponivel
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          data.titulo,
          data.isbn,
          data.editora,
          data.categoria,
          data.anoPublicacao,
          data.quantidadeTotal,
          data.quantidadeDisponivel
        ]
      )

      await this.replaceAutores(client, row.id, autorIds)

      return await this.requireById(client, row.id)
    })
  }

  async findAll(): Promise<Livro[]> {
    const { rows } = await this.pool.query<LivroRow>(
      `SELECT ${LIVRO_COLUMNS}
       ${LIVRO_JOINS}
       WHERE l.ativo = TRUE
       GROUP BY l.id
       ORDER BY l.titulo ASC`
    )

    return rows.map((row) => LivroModel.fromRow(row))
  }

  async findById(id: number): Promise<Livro | null> {
    return await this.selectById(this.pool, id)
  }

  async findByIsbn(isbn: string): Promise<Livro | null> {
    const { rows } = await this.pool.query<LivroRow>(
      `SELECT ${LIVRO_COLUMNS}
       ${LIVRO_JOINS}
       WHERE REGEXP_REPLACE(l.isbn, '[^0-9]', '', 'g')
             = REGEXP_REPLACE($1, '[^0-9]', '', 'g')
         AND l.ativo = TRUE
       GROUP BY l.id`,
      [isbn]
    )

    if (rows.length === 0) {
      return null
    }

    return LivroModel.fromRow(rows[0])
  }

  async update(
    id: number,
    data: SalvarLivroData,
    autorIds: number[]
  ): Promise<Livro | null> {
    return await this.runInTransaction(async (client) => {
      const { rowCount } = await client.query(
        `UPDATE livros
         SET titulo = $2,
             isbn = $3,
             editora = $4,
             categoria = $5,
             ano_publicacao = $6,
             quantidade_total = $7,
             quantidade_disponivel = $8
         WHERE id = $1
           AND ativo = TRUE`,
        [
          id,
          data.titulo,
          data.isbn,
          data.editora,
          data.categoria,
          data.anoPublicacao,
          data.quantidadeTotal,
          data.quantidadeDisponivel
        ]
      )

      if (rowCount === 0) {
        return null
      }

      await this.replaceAutores(client, id, autorIds)

      return await this.requireById(client, id)
    })
  }

  async remove(id: number): Promise<Livro | null> {
    const livro = await this.findById(id)

    if (!livro) {
      return null
    }

    const { rowCount } = await this.pool.query(
      `UPDATE livros
       SET ativo = FALSE
       WHERE id = $1
         AND ativo = TRUE`,
      [id]
    )

    if (rowCount === 0) {
      return null
    }

    return livro
  }

  async countEmprestimosAtivos(id: number): Promise<number> {
    const {
      rows: [row]
    } = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total
       FROM emprestimos
       WHERE livro_id = $1
         AND status IN ('ATIVO', 'ATRASADO')`,
      [id]
    )

    return Number(row.total)
  }

  private async runInTransaction<T>(
    operation: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')
      const result = await operation(client)
      await client.query('COMMIT')

      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private async replaceAutores(
    client: PoolClient,
    livroId: number,
    autorIds: number[]
  ): Promise<void> {
    await client.query(
      `DELETE FROM livro_autor
       WHERE livro_id = $1
         AND autor_id <> ALL($2::int[])`,
      [livroId, autorIds]
    )

    await client.query(
      `INSERT INTO livro_autor (livro_id, autor_id)
       SELECT $1, UNNEST($2::int[])
       ON CONFLICT (livro_id, autor_id) DO NOTHING`,
      [livroId, autorIds]
    )
  }

  private async selectById(
    executor: QueryExecutor,
    id: number
  ): Promise<Livro | null> {
    const { rows } = await executor.query<LivroRow>(
      `SELECT ${LIVRO_COLUMNS}
       ${LIVRO_JOINS}
       WHERE l.id = $1
         AND l.ativo = TRUE
       GROUP BY l.id`,
      [id]
    )

    if (rows.length === 0) {
      return null
    }

    return LivroModel.fromRow(rows[0])
  }

  private async requireById(client: PoolClient, id: number): Promise<Livro> {
    const livro = await this.selectById(client, id)

    if (!livro) {
      throw new Error(`Livro ${String(id)} nao encontrado apos a gravacao.`)
    }

    return livro
  }
}
