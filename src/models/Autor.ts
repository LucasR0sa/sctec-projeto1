export interface Autor {
  id: number
  nome: string
  nacionalidade: string | null
  dataNascimento: Date | null
  biografia: string | null
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}
