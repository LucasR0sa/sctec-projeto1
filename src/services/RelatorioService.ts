import {
  CategoriaResumoRow,
  ClienteComEmprestimoRow,
  EmprestimoPorLivroRow,
  LivroDisponivelRow,
  LivroEmprestadoRow,
  LivroPorAutorRow
} from '../models/Relatorio'
import { EmprestimoRepository } from '../repositories/EmprestimoRepository'
import { RelatorioRepository } from '../repositories/RelatorioRepository'

const LIMITE_TOP_CATEGORIAS = 5

export class RelatorioService {
  constructor(
    private readonly relatorioRepository: RelatorioRepository,
    private readonly emprestimoRepository: EmprestimoRepository
  ) {}

  async livrosDisponiveis(): Promise<LivroDisponivelRow[]> {
    return await this.relatorioRepository.livrosDisponiveis()
  }

  /**
   * Atualiza os vencidos antes de ler: um relatorio de emprestimos em aberto
   * que mostra ATIVO para um prazo ja vencido seria informacao errada.
   */
  async livrosEmprestados(): Promise<LivroEmprestadoRow[]> {
    await this.emprestimoRepository.atualizarAtrasados()

    return await this.relatorioRepository.livrosEmprestados()
  }

  async livrosPorAutor(): Promise<LivroPorAutorRow[]> {
    return await this.relatorioRepository.livrosPorAutor()
  }

  async emprestimosPorLivro(): Promise<EmprestimoPorLivroRow[]> {
    return await this.relatorioRepository.emprestimosPorLivro()
  }

  async clientesComEmprestimosAtivos(): Promise<ClienteComEmprestimoRow[]> {
    await this.emprestimoRepository.atualizarAtrasados()

    return await this.relatorioRepository.clientesComEmprestimosAtivos()
  }

  async topCategorias(): Promise<CategoriaResumoRow[]> {
    return await this.relatorioRepository.topCategorias(LIMITE_TOP_CATEGORIAS)
  }
}
