import { stdin as input, stdout as output } from 'node:process'
import { createInterface, Interface } from 'node:readline/promises'

/**
 * Sinaliza que a entrada padrao acabou (Ctrl+D ou entrada redirecionada).
 * Nao e erro de negocio nem falha tecnica: e o usuario encerrando a sessao,
 * entao a aplicacao deve fechar limpo em vez de estourar stack trace.
 */
export class CliClosedError extends Error {
  constructor() {
    super('Entrada encerrada pelo usuario.')
    this.name = 'CliClosedError'
  }
}

function isReadlineClosed(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'ERR_USE_AFTER_CLOSE'
  )
}

export class Cli {
  private readonly readline: Interface

  constructor() {
    this.readline = createInterface({ input, output })
  }

  /**
   * O erro so e verificado depois da leitura: o readline pode ja ter sinalizado
   * o fim da entrada e ainda ter linhas em buffer para entregar.
   */
  async ask(message: string): Promise<string> {
    try {
      const answer = await this.readline.question(message)

      return answer.trim()
    } catch (error) {
      if (isReadlineClosed(error)) {
        throw new CliClosedError()
      }

      throw error
    }
  }

  async pause(): Promise<void> {
    await this.ask('\nPressione ENTER para continuar...')
  }

  /**
   * Limpar a tela so faz sentido em terminal interativo. Com a saida
   * redirecionada para arquivo ou pipe, apagar o buffer destruiria o registro
   * da execucao — que e justamente o que documenta os exemplos do README.
   */
  clear(): void {
    if (output.isTTY) {
      console.clear()
    }
  }

  writeLine(message = ''): void {
    console.log(message)
  }

  close(): void {
    this.readline.close()
  }
}
