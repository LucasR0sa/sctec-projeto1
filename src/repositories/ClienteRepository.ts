import { Pool } from 'pg'

import {
  Cliente,
  ClienteModel,
  ClienteRow,
  SalvarClienteData
} from '../models/Cliente'

const CLIENTE_COLUMNS = `
  id,
  nome,
  email,
  telefone,
  documento,
  ativo,
  criado_em,
  atualizado_em
`

export class ClienteRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: SalvarClienteData): Promise<Cliente> {
    const {
      rows: [row]
    } = await this.pool.query<ClienteRow>(
      `INSERT INTO clientes (nome, email, telefone, documento)
       VALUES ($1, $2, $3, $4)
       RETURNING ${CLIENTE_COLUMNS}`,
      [data.nome, data.email, data.telefone, data.documento]
    )

    return ClienteModel.fromRow(row)
  }

  async findAll(): Promise<Cliente[]> {
    const { rows } = await this.pool.query<ClienteRow>(
      `SELECT ${CLIENTE_COLUMNS}
       FROM clientes
       WHERE ativo = TRUE
       ORDER BY nome ASC`
    )

    return rows.map((row) => ClienteModel.fromRow(row))
  }

  async findById(id: number): Promise<Cliente | null> {
    const { rows } = await this.pool.query<ClienteRow>(
      `SELECT ${CLIENTE_COLUMNS}
       FROM clientes
       WHERE id = $1
         AND ativo = TRUE`,
      [id]
    )

    if (rows.length === 0) {
      return null
    }

    return ClienteModel.fromRow(rows[0])
  }

  /**
   * Busca sem filtrar por ativo, pois email e documento sao identificadores
   * unicos globais: continuam reservados mesmo apos a remocao logica.
   */
  async findByEmail(email: string): Promise<Cliente | null> {
    const { rows } = await this.pool.query<ClienteRow>(
      `SELECT ${CLIENTE_COLUMNS}
       FROM clientes
       WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
      [email]
    )

    if (rows.length === 0) {
      return null
    }

    return ClienteModel.fromRow(rows[0])
  }

  async findByDocumento(documento: string): Promise<Cliente | null> {
    const { rows } = await this.pool.query<ClienteRow>(
      `SELECT ${CLIENTE_COLUMNS}
       FROM clientes
       WHERE REGEXP_REPLACE(documento, '[^0-9]', '', 'g')
             = REGEXP_REPLACE($1, '[^0-9]', '', 'g')`,
      [documento]
    )

    if (rows.length === 0) {
      return null
    }

    return ClienteModel.fromRow(rows[0])
  }

  async update(id: number, data: SalvarClienteData): Promise<Cliente | null> {
    const { rows } = await this.pool.query<ClienteRow>(
      `UPDATE clientes
       SET nome = $2,
           email = $3,
           telefone = $4,
           documento = $5
       WHERE id = $1
         AND ativo = TRUE
       RETURNING ${CLIENTE_COLUMNS}`,
      [id, data.nome, data.email, data.telefone, data.documento]
    )

    if (rows.length === 0) {
      return null
    }

    return ClienteModel.fromRow(rows[0])
  }

  async remove(id: number): Promise<Cliente | null> {
    const { rows } = await this.pool.query<ClienteRow>(
      `UPDATE clientes
       SET ativo = FALSE
       WHERE id = $1
         AND ativo = TRUE
       RETURNING ${CLIENTE_COLUMNS}`,
      [id]
    )

    if (rows.length === 0) {
      return null
    }

    return ClienteModel.fromRow(rows[0])
  }

  async countEmprestimosAtivos(id: number): Promise<number> {
    const {
      rows: [row]
    } = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total
       FROM emprestimos
       WHERE cliente_id = $1
         AND status IN ('ATIVO', 'ATRASADO')`,
      [id]
    )

    return Number(row.total)
  }
}
