export type EmprestimoStatus = 'ATIVO' | 'DEVOLVIDO' | 'ATRASADO'

export interface Emprestimo {
  id: number
  livroId: number
  livroTitulo: string
  clienteId: number
  clienteNome: string
  funcionarioId: number | null
  funcionarioNome: string | null
  dataEmprestimo: Date
  dataPrevistaDevolucao: string
  dataDevolucao: Date | null
  status: EmprestimoStatus
  observacao: string | null
}

export interface EmprestimoRow {
  id: number
  livro_id: number
  livro_titulo: string
  cliente_id: number
  cliente_nome: string
  funcionario_id: number | null
  funcionario_nome: string | null
  data_emprestimo: Date
  data_prevista_devolucao: string
  data_devolucao: Date | null
  status: EmprestimoStatus
  observacao: string | null
}

export interface RegistrarEmprestimoInput {
  livroId: string
  clienteId: string
  funcionarioId?: string
  diasParaDevolucao?: string
  observacao?: string
}

export interface RegistrarEmprestimoData {
  livroId: number
  clienteId: number
  funcionarioId: number | null
  diasParaDevolucao: number
  observacao: string | null
}

export class EmprestimoModel {
  static fromRow(row: EmprestimoRow): Emprestimo {
    return {
      id: row.id,
      livroId: row.livro_id,
      livroTitulo: row.livro_titulo,
      clienteId: row.cliente_id,
      clienteNome: row.cliente_nome,
      funcionarioId: row.funcionario_id,
      funcionarioNome: row.funcionario_nome,
      dataEmprestimo: row.data_emprestimo,
      dataPrevistaDevolucao: row.data_prevista_devolucao,
      dataDevolucao: row.data_devolucao,
      status: row.status,
      observacao: row.observacao
    }
  }
}
