import { AtualizarAutorInput, Autor } from '../models/Autor'
import { AutorService } from '../services/AutorService'
import { Cli, CliClosedError } from '../utils/Cli'
import { DomainError } from '../utils/DomainError'
import { parsePositiveInteger } from '../utils/validation.util'

export class AutorController {
  constructor(
    private readonly cli: Cli,
    private readonly autorService: AutorService
  ) {}

  async cadastrar(): Promise<void> {
    try {
      this.cli.writeLine('Cadastro de autor')

      const autor = await this.autorService.criar({
        nome: await this.cli.ask('Nome: '),
        nacionalidade: await this.cli.ask('Nacionalidade: '),
        dataNascimento: await this.cli.ask('Data de nascimento (AAAA-MM-DD): '),
        biografia: await this.cli.ask('Biografia: ')
      })

      this.cli.writeLine(
        `Autor cadastrado com sucesso. ID: ${String(autor.id)}`
      )
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async listar(): Promise<void> {
    try {
      const autores = await this.autorService.listar()

      this.cli.writeLine('Autores cadastrados')

      if (autores.length === 0) {
        this.cli.writeLine('Nenhum autor cadastrado.')
        await this.cli.pause()
        return
      }

      autores.forEach((autor) => {
        this.showAutorResumo(autor)
      })
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async consultar(): Promise<void> {
    try {
      const id = await this.askId('ID do autor: ')
      const autor = await this.autorService.buscarPorId(id)

      this.showAutorDetalhado(autor)
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async atualizar(): Promise<void> {
    try {
      const id = await this.askId('ID do autor que deseja atualizar: ')
      const autor = await this.autorService.buscarPorId(id)

      this.cli.writeLine('Deixe em branco para manter o valor atual.')
      this.showAutorDetalhado(autor)

      const input = this.removeEmptyFields({
        nome: await this.cli.ask('Novo nome: '),
        nacionalidade: await this.cli.ask('Nova nacionalidade: '),
        dataNascimento: await this.cli.ask(
          'Nova data de nascimento (AAAA-MM-DD): '
        ),
        biografia: await this.cli.ask('Nova biografia: ')
      })

      const updated = await this.autorService.atualizar(id, input)

      this.cli.writeLine(
        `Autor atualizado com sucesso. ID: ${String(updated.id)}`
      )
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async remover(): Promise<void> {
    try {
      const id = await this.askId('ID do autor que deseja remover: ')
      const autor = await this.autorService.buscarPorId(id)

      this.showAutorDetalhado(autor)

      const confirmation = await this.cli.ask('Confirmar remocao? (s/n): ')

      if (confirmation.toLowerCase() !== 's') {
        this.cli.writeLine('Remocao cancelada.')
        await this.cli.pause()
        return
      }

      await this.autorService.remover(id)
      this.cli.writeLine('Autor removido com sucesso.')
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  private async askId(message: string): Promise<number> {
    const value = await this.cli.ask(message)

    return parsePositiveInteger(value, 'ID')
  }

  private removeEmptyFields(
    input: Record<keyof AtualizarAutorInput, string>
  ): AtualizarAutorInput {
    const output: AtualizarAutorInput = {}

    if (input.nome.trim().length > 0) {
      output.nome = input.nome
    }

    if (input.nacionalidade.trim().length > 0) {
      output.nacionalidade = input.nacionalidade
    }

    if (input.dataNascimento.trim().length > 0) {
      output.dataNascimento = input.dataNascimento
    }

    if (input.biografia.trim().length > 0) {
      output.biografia = input.biografia
    }

    return output
  }

  private showAutorResumo(autor: Autor): void {
    this.cli.writeLine(
      `${String(autor.id)} | ${autor.nome} | ${
        autor.nacionalidade ?? 'Nacionalidade nao informada'
      }`
    )
  }

  private showAutorDetalhado(autor: Autor): void {
    this.cli.writeLine(`ID: ${String(autor.id)}`)
    this.cli.writeLine(`Nome: ${autor.nome}`)
    this.cli.writeLine(
      `Nacionalidade: ${autor.nacionalidade ?? 'Nao informada'}`
    )
    this.cli.writeLine(
      `Data de nascimento: ${autor.dataNascimento ?? 'Nao informada'}`
    )
    this.cli.writeLine(`Biografia: ${autor.biografia ?? 'Nao informada'}`)
  }

  private handleError(error: unknown): void {
    if (error instanceof CliClosedError) {
      throw error
    }

    if (error instanceof DomainError) {
      this.cli.writeLine(error.message)
      return
    }

    console.error(error)
    this.cli.writeLine('Erro inesperado. Verifique a conexao com o banco.')
  }
}
