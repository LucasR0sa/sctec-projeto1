import { Pool } from 'pg'

import {
  Funcionario,
  FuncionarioModel,
  FuncionarioRow,
  SalvarFuncionarioData
} from '../models/Funcionario'

/**
 * senha_hash nunca e projetada nas consultas de leitura: um hash exposto na
 * camada de apresentacao seria vazamento desnecessario.
 */
const FUNCIONARIO_COLUMNS = `
  id,
  nome,
  matricula,
  email,
  ativo,
  criado_em,
  atualizado_em
`

export class FuncionarioRepository {
  constructor(private readonly pool: Pool) {}

  async create(data: SalvarFuncionarioData): Promise<Funcionario> {
    const {
      rows: [row]
    } = await this.pool.query<FuncionarioRow>(
      `INSERT INTO funcionarios (nome, matricula, email, senha_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING ${FUNCIONARIO_COLUMNS}`,
      [data.nome, data.matricula, data.email, data.senhaHash]
    )

    return FuncionarioModel.fromRow(row)
  }

  async findAll(): Promise<Funcionario[]> {
    const { rows } = await this.pool.query<FuncionarioRow>(
      `SELECT ${FUNCIONARIO_COLUMNS}
       FROM funcionarios
       WHERE ativo = TRUE
       ORDER BY nome ASC`
    )

    return rows.map((row) => FuncionarioModel.fromRow(row))
  }

  async findById(id: number): Promise<Funcionario | null> {
    const { rows } = await this.pool.query<FuncionarioRow>(
      `SELECT ${FUNCIONARIO_COLUMNS}
       FROM funcionarios
       WHERE id = $1
         AND ativo = TRUE`,
      [id]
    )

    if (rows.length === 0) {
      return null
    }

    return FuncionarioModel.fromRow(rows[0])
  }

  async findByMatricula(matricula: string): Promise<Funcionario | null> {
    const { rows } = await this.pool.query<FuncionarioRow>(
      `SELECT ${FUNCIONARIO_COLUMNS}
       FROM funcionarios
       WHERE UPPER(TRIM(matricula)) = UPPER(TRIM($1))`,
      [matricula]
    )

    if (rows.length === 0) {
      return null
    }

    return FuncionarioModel.fromRow(rows[0])
  }

  async findByEmail(email: string): Promise<Funcionario | null> {
    const { rows } = await this.pool.query<FuncionarioRow>(
      `SELECT ${FUNCIONARIO_COLUMNS}
       FROM funcionarios
       WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
      [email]
    )

    if (rows.length === 0) {
      return null
    }

    return FuncionarioModel.fromRow(rows[0])
  }

  /**
   * senhaHash nulo mantem a senha atual: COALESCE evita ter que montar
   * dinamicamente a lista de colunas do UPDATE.
   */
  async update(
    id: number,
    data: SalvarFuncionarioData
  ): Promise<Funcionario | null> {
    const { rows } = await this.pool.query<FuncionarioRow>(
      `UPDATE funcionarios
       SET nome = $2,
           matricula = $3,
           email = $4,
           senha_hash = COALESCE($5, senha_hash)
       WHERE id = $1
         AND ativo = TRUE
       RETURNING ${FUNCIONARIO_COLUMNS}`,
      [id, data.nome, data.matricula, data.email, data.senhaHash]
    )

    if (rows.length === 0) {
      return null
    }

    return FuncionarioModel.fromRow(rows[0])
  }

  async remove(id: number): Promise<Funcionario | null> {
    const { rows } = await this.pool.query<FuncionarioRow>(
      `UPDATE funcionarios
       SET ativo = FALSE
       WHERE id = $1
         AND ativo = TRUE
       RETURNING ${FUNCIONARIO_COLUMNS}`,
      [id]
    )

    if (rows.length === 0) {
      return null
    }

    return FuncionarioModel.fromRow(rows[0])
  }

  async countEmprestimosAtivos(id: number): Promise<number> {
    const {
      rows: [row]
    } = await this.pool.query<{ total: string }>(
      `SELECT COUNT(*) AS total
       FROM emprestimos
       WHERE funcionario_id = $1
         AND status IN ('ATIVO', 'ATRASADO')`,
      [id]
    )

    return Number(row.total)
  }
}
