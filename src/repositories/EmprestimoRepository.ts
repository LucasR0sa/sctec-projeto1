import { Pool, PoolClient } from 'pg'

import {
  Emprestimo,
  EmprestimoModel,
  EmprestimoRow,
  EmprestimoStatus,
  RegistrarEmprestimoData
} from '../models/Emprestimo'

const EMPRESTIMO_COLUMNS = `
  e.id,
  e.livro_id,
  l.titulo AS livro_titulo,
  e.cliente_id,
  c.nome AS cliente_nome,
  e.funcionario_id,
  f.nome AS funcionario_nome,
  e.data_emprestimo,
  e.data_prevista_devolucao,
  e.data_devolucao,
  e.status,
  e.observacao
`

const EMPRESTIMO_JOINS = `
  FROM emprestimos e
  INNER JOIN livros l ON l.id = e.livro_id
  INNER JOIN clientes c ON c.id = e.cliente_id
  LEFT JOIN funcionarios f ON f.id = e.funcionario_id
`

export class EmprestimoRepository {
  constructor(private readonly pool: Pool) {}

  /**
   * Registra o emprestimo em transacao. O SELECT ... FOR UPDATE bloqueia a
   * linha do livro ate o COMMIT: sem isso, duas retiradas simultaneas do
   * ultimo exemplar poderiam ler quantidade_disponivel = 1 ao mesmo tempo.
   * A baixa do estoque em si e feita pelo trigger do banco.
   */
  async create(data: RegistrarEmprestimoData): Promise<Emprestimo> {
    return await this.runInTransaction(async (client) => {
      const { rows: disponibilidade } = await client.query<{
        quantidade_disponivel: number
      }>(
        `SELECT quantidade_disponivel
         FROM livros
         WHERE id = $1
           AND ativo = TRUE
         FOR UPDATE`,
        [data.livroId]
      )

      if (disponibilidade.length === 0) {
        return null
      }

      if (disponibilidade[0].quantidade_disponivel <= 0) {
        return 'INDISPONIVEL' as const
      }

      const {
        rows: [{ id }]
      } = await client.query<{ id: number }>(
        `INSERT INTO emprestimos (
           livro_id,
           cliente_id,
           funcionario_id,
           data_prevista_devolucao,
           observacao
         )
         VALUES ($1, $2, $3, CURRENT_DATE + $4::int, $5)
         RETURNING id`,
        [
          data.livroId,
          data.clienteId,
          data.funcionarioId,
          data.diasParaDevolucao,
          data.observacao
        ]
      )

      return await this.selectById(client, id)
    }).then((result) => {
      if (result === null) {
        throw new Error('Livro nao encontrado ao registrar emprestimo.')
      }

      if (result === 'INDISPONIVEL') {
        throw new Error('Livro indisponivel para emprestimo')
      }

      return result
    })
  }

  /**
   * A devolucao apenas muda o status. O trigger BEFORE UPDATE do banco carimba
   * data_devolucao e devolve o exemplar ao acervo, mantendo a regra proxima
   * dos dados mesmo se outra aplicacao alterar a tabela.
   */
  async registrarDevolucao(id: number): Promise<Emprestimo | null> {
    return await this.runInTransaction(async (client) => {
      const { rowCount } = await client.query(
        `UPDATE emprestimos
         SET status = 'DEVOLVIDO'
         WHERE id = $1
           AND status IN ('ATIVO', 'ATRASADO')`,
        [id]
      )

      if (rowCount === 0) {
        return null
      }

      return await this.selectById(client, id)
    })
  }

  async findAll(): Promise<Emprestimo[]> {
    const { rows } = await this.pool.query<EmprestimoRow>(
      `SELECT ${EMPRESTIMO_COLUMNS}
       ${EMPRESTIMO_JOINS}
       ORDER BY e.data_emprestimo DESC`
    )

    return rows.map((row) => EmprestimoModel.fromRow(row))
  }

  async findByStatus(status: EmprestimoStatus[]): Promise<Emprestimo[]> {
    const { rows } = await this.pool.query<EmprestimoRow>(
      `SELECT ${EMPRESTIMO_COLUMNS}
       ${EMPRESTIMO_JOINS}
       WHERE e.status = ANY($1::varchar[])
       ORDER BY e.data_prevista_devolucao ASC`,
      [status]
    )

    return rows.map((row) => EmprestimoModel.fromRow(row))
  }

  async findById(id: number): Promise<Emprestimo | null> {
    return await this.selectById(this.pool, id)
  }

  /**
   * Emprestimos vencidos passam de ATIVO para ATRASADO. Roda antes das
   * listagens para que o status refletido na CLI seja sempre o atual.
   */
  async atualizarAtrasados(): Promise<number> {
    const { rowCount } = await this.pool.query(
      `UPDATE emprestimos
       SET status = 'ATRASADO'
       WHERE status = 'ATIVO'
         AND data_prevista_devolucao < CURRENT_DATE`
    )

    return rowCount ?? 0
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

  private async selectById(
    executor: Pool | PoolClient,
    id: number
  ): Promise<Emprestimo | null> {
    const { rows } = await executor.query<EmprestimoRow>(
      `SELECT ${EMPRESTIMO_COLUMNS}
       ${EMPRESTIMO_JOINS}
       WHERE e.id = $1`,
      [id]
    )

    if (rows.length === 0) {
      return null
    }

    return EmprestimoModel.fromRow(rows[0])
  }
}
