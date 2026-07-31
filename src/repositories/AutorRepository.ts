import { Pool } from 'pg'

import { Autor, AutorModel, AutorRow, SalvarAutorData } from '../models/Autor'

const AUTHOR_COLUMNS = `
  id,
  nome,
  nacionalidade,
  data_nascimento,
  biografia,
  ativo,
  criado_em,
  atualizado_em
`

export class AutorRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: SalvarAutorData): Promise<Autor> {
    const {
      rows: [row]
    } = await this.pool.query<AutorRow>(
      `INSERT INTO autores (nome, nacionalidade, data_nascimento, biografia)
       VALUES ($1, $2, $3, $4)
       RETURNING ${AUTHOR_COLUMNS}`,
      [data.nome, data.nacionalidade, data.dataNascimento, data.biografia]
    )

    return AutorModel.fromRow(row)
  }

  async findAll(): Promise<Autor[]> {
    const { rows } = await this.pool.query<AutorRow>(
      `SELECT ${AUTHOR_COLUMNS}
       FROM autores
       WHERE ativo = TRUE
       ORDER BY nome ASC`
    )

    return rows.map((row) => AutorModel.fromRow(row))
  }

  async findById(id: number): Promise<Autor | null> {
    const { rows } = await this.pool.query<AutorRow>(
      `SELECT ${AUTHOR_COLUMNS}
       FROM autores
       WHERE id = $1
         AND ativo = TRUE`,
      [id]
    )

    if (rows.length === 0) {
      return null
    }

    return AutorModel.fromRow(rows[0])
  }

  async findByName(nome: string): Promise<Autor | null> {
    const { rows } = await this.pool.query<AutorRow>(
      `SELECT ${AUTHOR_COLUMNS}
       FROM autores
       WHERE LOWER(TRIM(nome)) = LOWER(TRIM($1))
         AND ativo = TRUE`,
      [nome]
    )

    if (rows.length === 0) {
      return null
    }

    return AutorModel.fromRow(rows[0])
  }

  async findExistingIds(ids: number[]): Promise<number[]> {
    const { rows } = await this.pool.query<{ id: number }>(
      `SELECT id
       FROM autores
       WHERE id = ANY($1::int[])
         AND ativo = TRUE`,
      [ids]
    )

    return rows.map((row) => row.id)
  }

  async update(id: number, data: SalvarAutorData): Promise<Autor | null> {
    const { rows } = await this.pool.query<AutorRow>(
      `UPDATE autores
       SET nome = $2,
           nacionalidade = $3,
           data_nascimento = $4,
           biografia = $5
       WHERE id = $1
         AND ativo = TRUE
       RETURNING ${AUTHOR_COLUMNS}`,
      [id, data.nome, data.nacionalidade, data.dataNascimento, data.biografia]
    )

    if (rows.length === 0) {
      return null
    }

    return AutorModel.fromRow(rows[0])
  }

  async remove(id: number): Promise<Autor | null> {
    const { rows } = await this.pool.query<AutorRow>(
      `UPDATE autores
       SET ativo = FALSE
       WHERE id = $1
         AND ativo = TRUE
       RETURNING ${AUTHOR_COLUMNS}`,
      [id]
    )

    if (rows.length === 0) {
      return null
    }

    return AutorModel.fromRow(rows[0])
  }
}
