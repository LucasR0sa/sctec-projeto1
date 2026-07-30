import { stdin as input, stdout as output } from 'node:process'
import { createInterface, Interface } from 'node:readline/promises'

export class Cli {
  private readonly readline: Interface

  constructor() {
    this.readline = createInterface({ input, output })
  }

  async ask(message: string): Promise<string> {
    const answer = await this.readline.question(message)

    return answer.trim()
  }

  async pause(): Promise<void> {
    await this.ask('\nPressione ENTER para continuar...')
  }

  clear(): void {
    console.clear()
  }

  writeLine(message = ''): void {
    console.log(message)
  }

  close(): void {
    this.readline.close()
  }
}
