import {
  AtualizarLivroInput,
  CriarLivroInput,
  Livro,
  SalvarLivroData
} from '../models/Livro'
import { AutorRepository } from '../repositories/AutorRepository'
import { LivroRepository } from '../repositories/LivroRepository'
import {
  isForeignKeyViolation,
  isUniqueViolation
} from '../utils/database.util'
import { DomainError } from '../utils/DomainError'
import {
  normalizeOptionalText,
  parseIdList,
  parseIntegerInRange,
  parseIsbn,
  parseOptionalIntegerInRange,
  requireMinText
} from '../utils/validation.util'

const LIVRO_ISBN_CONSTRAINT = 'livros_isbn_key'
const LIVRO_AUTOR_CONSTRAINT = 'fk_livro_autor_autor'
const ANO_MINIMO = 1000
const ANO_MAXIMO = 2100
const QUANTIDADE_MAXIMA = 100000

export class LivroService {
  constructor(
    private readonly livroRepository: LivroRepository,
    private readonly autorRepository: AutorRepository
  ) {}

  async criar(input: CriarLivroInput): Promise<Livro> {
    const autorIds = await this.resolveAutorIds(input.autorIds)
    const quantidadeTotal = parseIntegerInRange(
      input.quantidadeTotal,
      'Quantidade total',
      1,
      QUANTIDADE_MAXIMA
    )

    const data: SalvarLivroData = {
      titulo: requireMinText(input.titulo, 'Titulo do livro', 2),
      isbn: parseIsbn(input.isbn),
      editora: normalizeOptionalText(input.editora),
      categoria: normalizeOptionalText(input.categoria),
      anoPublicacao: parseOptionalIntegerInRange(
        input.anoPublicacao,
        'Ano de publicacao',
        ANO_MINIMO,
        ANO_MAXIMO
      ),
      quantidadeTotal,
      // Livro recem cadastrado ainda nao possui emprestimos.
      quantidadeDisponivel: quantidadeTotal
    }

    await this.ensureIsbnIsAvailable(data.isbn)

    return await this.runProtegido(
      async () => await this.livroRepository.create(data, autorIds)
    )
  }

  async listar(): Promise<Livro[]> {
    return await this.livroRepository.findAll()
  }

  async buscarPorId(id: number): Promise<Livro> {
    const livro = await this.livroRepository.findById(id)

    if (!livro) {
      throw new DomainError('Livro nao encontrado.')
    }

    return livro
  }

  async atualizar(id: number, input: AtualizarLivroInput): Promise<Livro> {
    const current = await this.buscarPorId(id)
    const autorIds =
      input.autorIds === undefined
        ? current.autorIds
        : await this.resolveAutorIds(input.autorIds)

    if (autorIds.length === 0) {
      throw new DomainError('Livro precisa ter pelo menos um autor vinculado.')
    }

    const data = await this.prepareUpdateData(current, input)
    const updated = await this.runProtegido(
      async () => await this.livroRepository.update(id, data, autorIds)
    )

    if (!updated) {
      throw new DomainError('Livro nao encontrado para atualizacao.')
    }

    return updated
  }

  async remover(id: number): Promise<Livro> {
    const livro = await this.buscarPorId(id)
    const emprestimosAtivos =
      await this.livroRepository.countEmprestimosAtivos(id)

    if (emprestimosAtivos > 0) {
      throw new DomainError(
        `Livro possui ${String(emprestimosAtivos)} emprestimo(s) ativo(s) e nao pode ser removido.`
      )
    }

    const removed = await this.livroRepository.remove(livro.id)

    if (!removed) {
      throw new DomainError('Livro nao encontrado para remocao.')
    }

    return removed
  }

  private async prepareUpdateData(
    current: Livro,
    input: AtualizarLivroInput
  ): Promise<SalvarLivroData> {
    const isbn = input.isbn === undefined ? current.isbn : parseIsbn(input.isbn)

    if (isbn !== current.isbn) {
      await this.ensureIsbnIsAvailable(isbn, current.id)
    }

    const quantidadeTotal =
      input.quantidadeTotal === undefined
        ? current.quantidadeTotal
        : parseIntegerInRange(
            input.quantidadeTotal,
            'Quantidade total',
            1,
            QUANTIDADE_MAXIMA
          )

    return {
      titulo:
        input.titulo === undefined
          ? current.titulo
          : requireMinText(input.titulo, 'Titulo do livro', 2),
      isbn,
      editora:
        input.editora === undefined
          ? current.editora
          : normalizeOptionalText(input.editora),
      categoria:
        input.categoria === undefined
          ? current.categoria
          : normalizeOptionalText(input.categoria),
      anoPublicacao:
        input.anoPublicacao === undefined
          ? current.anoPublicacao
          : parseOptionalIntegerInRange(
              input.anoPublicacao,
              'Ano de publicacao',
              ANO_MINIMO,
              ANO_MAXIMO
            ),
      quantidadeTotal,
      quantidadeDisponivel: this.recalcularDisponibilidade(
        current,
        quantidadeTotal
      )
    }
  }

  /**
   * Exemplares emprestados nao podem sumir quando o total muda. A quantidade
   * disponivel e sempre o novo total menos o que esta na mao dos clientes.
   */
  private recalcularDisponibilidade(current: Livro, novoTotal: number): number {
    const emprestados = current.quantidadeTotal - current.quantidadeDisponivel

    if (novoTotal < emprestados) {
      throw new DomainError(
        `Existem ${String(emprestados)} exemplar(es) emprestado(s). A quantidade total nao pode ser menor que isso.`
      )
    }

    return novoTotal - emprestados
  }

  private async resolveAutorIds(rawIds: string): Promise<number[]> {
    const ids = parseIdList(rawIds, 'ID de autor')
    const existentes = await this.autorRepository.findExistingIds(ids)
    const inexistentes = ids.filter((id) => !existentes.includes(id))

    if (inexistentes.length > 0) {
      throw new DomainError(
        `Autor(es) nao encontrado(s): ${inexistentes.join(', ')}.`
      )
    }

    return ids
  }

  private async ensureIsbnIsAvailable(
    isbn: string,
    ignoredId?: number
  ): Promise<void> {
    const existing = await this.livroRepository.findByIsbn(isbn)

    if (existing && existing.id !== ignoredId) {
      throw new DomainError('Ja existe um livro cadastrado com esse ISBN.')
    }
  }

  private async runProtegido<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (isUniqueViolation(error, LIVRO_ISBN_CONSTRAINT)) {
        throw new DomainError('Ja existe um livro cadastrado com esse ISBN.')
      }

      if (isForeignKeyViolation(error, LIVRO_AUTOR_CONSTRAINT)) {
        throw new DomainError('Um dos autores informados nao existe.')
      }

      throw error
    }
  }
}
