import {
  AtualizarAutorInput,
  Autor,
  CriarAutorInput,
  SalvarAutorData
} from '../models/Autor'
import { AutorRepository } from '../repositories/AutorRepository'
import { isUniqueViolation } from '../utils/database.util'
import { DomainError } from '../utils/DomainError'
import {
  normalizeOptionalText,
  parseOptionalDate,
  requireMinText
} from '../utils/validation.util'

const AUTOR_NOME_CONSTRAINT = 'uq_autores_nome_normalizado'

export class AutorService {
  constructor(private readonly autorRepository: AutorRepository) {}

  async criar(input: CriarAutorInput): Promise<Autor> {
    const data = await this.prepareCreateData(input)

    try {
      return await this.autorRepository.create(data)
    } catch (error) {
      if (isUniqueViolation(error, AUTOR_NOME_CONSTRAINT)) {
        throw new DomainError('Ja existe um autor cadastrado com esse nome.')
      }

      throw error
    }
  }

  async listar(): Promise<Autor[]> {
    return await this.autorRepository.findAll()
  }

  async buscarPorId(id: number): Promise<Autor> {
    const autor = await this.autorRepository.findById(id)

    if (!autor) {
      throw new DomainError('Autor nao encontrado.')
    }

    return autor
  }

  async atualizar(id: number, input: AtualizarAutorInput): Promise<Autor> {
    const current = await this.buscarPorId(id)
    const data = await this.prepareUpdateData(current, input)

    let updated: Autor | null

    try {
      updated = await this.autorRepository.update(id, data)
    } catch (error) {
      if (isUniqueViolation(error, AUTOR_NOME_CONSTRAINT)) {
        throw new DomainError('Ja existe um autor cadastrado com esse nome.')
      }

      throw error
    }

    if (!updated) {
      throw new DomainError('Autor nao encontrado para atualizacao.')
    }

    return updated
  }

  async remover(id: number): Promise<Autor> {
    const removed = await this.autorRepository.remove(id)

    if (!removed) {
      throw new DomainError('Autor nao encontrado para remocao.')
    }

    return removed
  }

  private async prepareCreateData(
    input: CriarAutorInput
  ): Promise<SalvarAutorData> {
    const nome = requireMinText(input.nome, 'Nome do autor', 3)
    await this.ensureNameIsAvailable(nome)

    return {
      nome,
      nacionalidade: normalizeOptionalText(input.nacionalidade),
      dataNascimento: parseOptionalDate(input.dataNascimento),
      biografia: normalizeOptionalText(input.biografia)
    }
  }

  private async prepareUpdateData(
    current: Autor,
    input: AtualizarAutorInput
  ): Promise<SalvarAutorData> {
    const nome =
      input.nome === undefined
        ? current.nome
        : requireMinText(input.nome, 'Nome do autor', 3)

    await this.ensureNameIsAvailable(nome, current.id)

    return {
      nome,
      nacionalidade:
        input.nacionalidade === undefined
          ? current.nacionalidade
          : normalizeOptionalText(input.nacionalidade),
      dataNascimento:
        input.dataNascimento === undefined
          ? current.dataNascimento
          : parseOptionalDate(input.dataNascimento),
      biografia:
        input.biografia === undefined
          ? current.biografia
          : normalizeOptionalText(input.biografia)
    }
  }

  private async ensureNameIsAvailable(
    nome: string,
    ignoredId?: number
  ): Promise<void> {
    const existing = await this.autorRepository.findByName(nome)

    if (existing && existing.id !== ignoredId) {
      throw new DomainError('Ja existe um autor cadastrado com esse nome.')
    }
  }
}
