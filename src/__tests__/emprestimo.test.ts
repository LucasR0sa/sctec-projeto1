import 'dotenv/config'

import assert from 'node:assert/strict'
import { after, before, describe, it } from 'node:test'

import { closeDatabaseConnection, pool } from '../database/connection'
import { ClienteRepository } from '../repositories/ClienteRepository'
import { EmprestimoRepository } from '../repositories/EmprestimoRepository'
import { LivroRepository } from '../repositories/LivroRepository'
import { EmprestimoService } from '../services/EmprestimoService'
import { DomainError } from '../utils/DomainError'

const ISBN_FIXTURE = '9780000000019'
const OBSERVACAO_FIXTURE = 'FIXTURE-TESTE'

const livroRepository = new LivroRepository(pool)
const clienteRepository = new ClienteRepository(pool)
const emprestimoRepository = new EmprestimoRepository(pool)
const service = new EmprestimoService(
  emprestimoRepository,
  livroRepository,
  clienteRepository
)

let livroId: number
let autorId: number
let clienteA: number
let clienteB: number

async function disponivel(id: number): Promise<number> {
  const {
    rows: [row]
  } = await pool.query<{ quantidade_disponivel: number }>(
    'SELECT quantidade_disponivel FROM livros WHERE id = $1',
    [id]
  )

  return row.quantidade_disponivel
}

async function limpar(): Promise<void> {
  await pool.query('DELETE FROM emprestimos WHERE observacao = $1', [
    OBSERVACAO_FIXTURE
  ])
  await pool.query(
    'DELETE FROM livro_autor WHERE livro_id IN (SELECT id FROM livros WHERE isbn = $1)',
    [ISBN_FIXTURE]
  )
  await pool.query('DELETE FROM livros WHERE isbn = $1', [ISBN_FIXTURE])
}

/**
 * Testes de integracao: exercitam service, repository, constraints e triggers
 * contra o banco real, porque a regra de disponibilidade e cumprida em conjunto
 * pela aplicacao e pelo PostgreSQL. Um mock do repository nao provaria nada.
 */
describe('Regra de disponibilidade em emprestimo e devolucao', () => {
  before(async () => {
    await limpar()

    const {
      rows: [autor]
    } = await pool.query<{ id: number }>(
      'SELECT id FROM autores WHERE ativo = TRUE ORDER BY id LIMIT 1'
    )
    autorId = autor.id

    const { rows: clientes } = await pool.query<{ id: number }>(
      'SELECT id FROM clientes WHERE ativo = TRUE ORDER BY id LIMIT 2'
    )
    clienteA = clientes[0].id
    clienteB = clientes[1].id

    // Um unico exemplar: e o cenario que expoe a regra de disponibilidade.
    const {
      rows: [livro]
    } = await pool.query<{ id: number }>(
      `INSERT INTO livros (titulo, isbn, quantidade_total, quantidade_disponivel)
       VALUES ('Livro de Teste', $1, 1, 1)
       RETURNING id`,
      [ISBN_FIXTURE]
    )
    livroId = livro.id

    await pool.query(
      'INSERT INTO livro_autor (livro_id, autor_id) VALUES ($1, $2)',
      [livroId, autorId]
    )
  })

  after(async () => {
    await limpar()
    await closeDatabaseConnection()
  })

  it('recusa emprestimo de livro inexistente', async () => {
    await assert.rejects(
      async () =>
        await service.registrar({
          livroId: '999999',
          clienteId: String(clienteA)
        }),
      (error: unknown) =>
        error instanceof DomainError && error.message.includes('Livro')
    )
  })

  it('recusa emprestimo para cliente inexistente', async () => {
    await assert.rejects(
      async () =>
        await service.registrar({
          livroId: String(livroId),
          clienteId: '999999'
        }),
      (error: unknown) =>
        error instanceof DomainError && error.message.includes('Cliente')
    )
  })

  it('recusa identificador que nao seja inteiro positivo', async () => {
    await assert.rejects(
      async () =>
        await service.registrar({
          livroId: 'abc',
          clienteId: String(clienteA)
        }),
      (error: unknown) => error instanceof DomainError
    )
  })

  it('baixa um exemplar ao registrar o emprestimo', async () => {
    assert.equal(await disponivel(livroId), 1)

    const emprestimo = await service.registrar({
      livroId: String(livroId),
      clienteId: String(clienteA),
      observacao: OBSERVACAO_FIXTURE
    })

    assert.equal(emprestimo.status, 'ATIVO')
    assert.equal(await disponivel(livroId), 0)
  })

  it('recusa emprestimo sem exemplar disponivel', async () => {
    await assert.rejects(
      async () =>
        await service.registrar({
          livroId: String(livroId),
          clienteId: String(clienteB),
          observacao: OBSERVACAO_FIXTURE
        }),
      (error: unknown) =>
        error instanceof DomainError && error.message.includes('disponivel')
    )
  })

  it('mantem o estoque intacto depois da tentativa recusada', async () => {
    assert.equal(await disponivel(livroId), 0)
  })

  it('recusa o mesmo livro para o mesmo cliente duas vezes', async () => {
    await pool.query(
      'UPDATE livros SET quantidade_total = 3, quantidade_disponivel = 2 WHERE id = $1',
      [livroId]
    )

    await assert.rejects(
      async () =>
        await service.registrar({
          livroId: String(livroId),
          clienteId: String(clienteA),
          observacao: OBSERVACAO_FIXTURE
        }),
      (error: unknown) =>
        error instanceof DomainError && error.message.includes('ja possui')
    )
  })

  it('devolve o exemplar ao acervo e carimba a data', async () => {
    const pendentes = await service.listarPendentes()
    const alvo = pendentes.find((e) => e.livroId === livroId)

    assert.ok(alvo, 'emprestimo de teste deveria estar em aberto')

    const antes = await disponivel(livroId)
    const devolvido = await service.registrarDevolucao(alvo.id)

    assert.equal(devolvido.status, 'DEVOLVIDO')
    assert.notEqual(devolvido.dataDevolucao, null)
    assert.equal(await disponivel(livroId), antes + 1)
  })

  it('recusa devolver duas vezes o mesmo emprestimo', async () => {
    const todos = await service.listar()
    const devolvido = todos.find(
      (e) => e.livroId === livroId && e.status === 'DEVOLVIDO'
    )

    assert.ok(devolvido, 'deveria existir um emprestimo devolvido')

    await assert.rejects(
      async () => await service.registrarDevolucao(devolvido.id),
      (error: unknown) =>
        error instanceof DomainError && error.message.includes('ja foi')
    )
  })

  it('recusa devolucao de emprestimo inexistente', async () => {
    await assert.rejects(
      async () => await service.registrarDevolucao(999999),
      (error: unknown) =>
        error instanceof DomainError && error.message.includes('nao encontrado')
    )
  })
})
