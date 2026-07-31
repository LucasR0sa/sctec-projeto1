import { AtualizarLivroInput, Livro } from '../models/Livro'
import { LivroService } from '../services/LivroService'
import { Cli, CliClosedError } from '../utils/Cli'
import { DomainError } from '../utils/DomainError'
import { parsePositiveInteger } from '../utils/validation.util'

export class LivroController {
  constructor(
    private readonly cli: Cli,
    private readonly livroService: LivroService
  ) {}

  async cadastrar(): Promise<void> {
    try {
      this.cli.writeLine('Cadastro de livro')

      const livro = await this.livroService.criar({
        titulo: await this.cli.ask('Titulo: '),
        isbn: await this.cli.ask('ISBN (10 ou 13 digitos): '),
        editora: await this.cli.ask('Editora: '),
        categoria: await this.cli.ask('Categoria: '),
        anoPublicacao: await this.cli.ask('Ano de publicacao: '),
        quantidadeTotal: await this.cli.ask('Quantidade total: '),
        autorIds: await this.cli.ask(
          'IDs dos autores (separados por virgula): '
        )
      })

      this.cli.writeLine(
        `Livro cadastrado com sucesso. ID: ${String(livro.id)}`
      )
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async listar(): Promise<void> {
    try {
      const livros = await this.livroService.listar()

      this.cli.writeLine('Livros cadastrados')

      if (livros.length === 0) {
        this.cli.writeLine('Nenhum livro cadastrado.')
        await this.cli.pause()
        return
      }

      livros.forEach((livro) => {
        this.showLivroResumo(livro)
      })
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async consultar(): Promise<void> {
    try {
      const id = await this.askId('ID do livro: ')
      const livro = await this.livroService.buscarPorId(id)

      this.showLivroDetalhado(livro)
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async atualizar(): Promise<void> {
    try {
      const id = await this.askId('ID do livro que deseja atualizar: ')
      const livro = await this.livroService.buscarPorId(id)

      this.cli.writeLine('Deixe em branco para manter o valor atual.')
      this.showLivroDetalhado(livro)

      const input = this.removeEmptyFields({
        titulo: await this.cli.ask('Novo titulo: '),
        isbn: await this.cli.ask('Novo ISBN: '),
        editora: await this.cli.ask('Nova editora: '),
        categoria: await this.cli.ask('Nova categoria: '),
        anoPublicacao: await this.cli.ask('Novo ano de publicacao: '),
        quantidadeTotal: await this.cli.ask('Nova quantidade total: '),
        autorIds: await this.cli.ask('Novos IDs de autores (virgula): ')
      })

      const updated = await this.livroService.atualizar(id, input)

      this.cli.writeLine(
        `Livro atualizado com sucesso. ID: ${String(updated.id)}`
      )
    } catch (error) {
      this.handleError(error)
    }

    await this.cli.pause()
  }

  async remover(): Promise<void> {
    try {
      const id = await this.askId('ID do livro que deseja remover: ')
      const livro = await this.livroService.buscarPorId(id)

      this.showLivroDetalhado(livro)

      const confirmation = await this.cli.ask('Confirmar remocao? (s/n): ')

      if (confirmation.toLowerCase() !== 's') {
        this.cli.writeLine('Remocao cancelada.')
        await this.cli.pause()
        return
      }

      await this.livroService.remover(id)
      this.cli.writeLine('Livro removido com sucesso.')
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
    input: Record<keyof AtualizarLivroInput, string>
  ): AtualizarLivroInput {
    const output: AtualizarLivroInput = {}

    if (input.titulo.trim().length > 0) {
      output.titulo = input.titulo
    }

    if (input.isbn.trim().length > 0) {
      output.isbn = input.isbn
    }

    if (input.editora.trim().length > 0) {
      output.editora = input.editora
    }

    if (input.categoria.trim().length > 0) {
      output.categoria = input.categoria
    }

    if (input.anoPublicacao.trim().length > 0) {
      output.anoPublicacao = input.anoPublicacao
    }

    if (input.quantidadeTotal.trim().length > 0) {
      output.quantidadeTotal = input.quantidadeTotal
    }

    if (input.autorIds.trim().length > 0) {
      output.autorIds = input.autorIds
    }

    return output
  }

  private showLivroResumo(livro: Livro): void {
    this.cli.writeLine(
      `${String(livro.id)} | ${livro.titulo} | ${this.formatAutores(livro)} | ${String(livro.quantidadeDisponivel)}/${String(livro.quantidadeTotal)} disponiveis`
    )
  }

  private showLivroDetalhado(livro: Livro): void {
    this.cli.writeLine(`ID: ${String(livro.id)}`)
    this.cli.writeLine(`Titulo: ${livro.titulo}`)
    this.cli.writeLine(`ISBN: ${livro.isbn}`)
    this.cli.writeLine(`Editora: ${livro.editora ?? 'Nao informada'}`)
    this.cli.writeLine(`Categoria: ${livro.categoria ?? 'Nao informada'}`)
    this.cli.writeLine(
      `Ano de publicacao: ${livro.anoPublicacao === null ? 'Nao informado' : String(livro.anoPublicacao)}`
    )
    this.cli.writeLine(`Quantidade total: ${String(livro.quantidadeTotal)}`)
    this.cli.writeLine(
      `Quantidade disponivel: ${String(livro.quantidadeDisponivel)}`
    )
    this.cli.writeLine(`Autores: ${this.formatAutores(livro)}`)
    this.cli.writeLine(`IDs dos autores: ${livro.autorIds.join(', ')}`)
  }

  private formatAutores(livro: Livro): string {
    return livro.autores.length > 0
      ? livro.autores.join(', ')
      : 'Sem autor vinculado'
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
