# Roteiro do video — BookStore Manager CLI

Duracao alvo: **5 a 10 minutos**. Gravar a tela durante toda a demonstracao.

> **Antes de gravar (checklist de 2 minutos)**
>
> - [ ] Rodar `npm run db:reset` para o banco ficar no estado do seed (dados previsiveis)
> - [ ] Fechar abas e janelas que nao fazem parte da demo
> - [ ] Deixar abertos: VS Code (na pasta do projeto), DBeaver conectado em `bookstore_manager`, um terminal limpo
> - [ ] Aumentar a fonte do terminal (Ctrl + Shift + +) para o texto ficar legivel no video
> - [ ] Testar o microfone gravando 10 segundos

---

## 1. Abertura (0:00 – 0:45)

**Mostrar:** README.md aberto no VS Code.

**Falar:**

> "Oi, eu sou o Lucas. Esse e o BookStore Manager CLI, uma aplicacao de linha de comando em Node.js com TypeScript para gerenciar uma livraria, com persistencia em PostgreSQL.
>
> A aplicacao gerencia autores, livros, clientes e emprestimos. Todo o acesso ao banco e feito com SQL nativo pela biblioteca `pg`, com queries parametrizadas — sem ORM e sem query builder, como o enunciado exige."

---

## 2. Arquitetura em camadas (0:45 – 1:45)

**Mostrar:** a arvore de `src/` no explorador do VS Code, expandindo as pastas.

**Falar:**

> "A estrutura segue a arquitetura em camadas exigida no RF04. Cada camada tem uma responsabilidade unica:
>
> - `menus` e `controllers` cuidam da conversa com o usuario no terminal;
> - `services` concentram a regra de negocio;
> - `repositories` sao os unicos que conhecem SQL;
> - `models` guardam as interfaces e tipos;
> - `database` tem a conexao e os scripts;
> - `utils` tem funcoes reutilizaveis.
>
> O fluxo e sempre o mesmo: Menu, Controller, Service, Repository, PostgreSQL."

**Mostrar:** abrir [src/main.ts](src/main.ts) e apontar o bloco de montagem das dependencias.

**Falar:**

> "No `main.ts` eu monto essa cadeia por injecao de dependencia. O repository recebe o pool, o service recebe o repository, o controller recebe o service. Nenhuma classe cria a propria conexao — isso deixa cada camada testavel isoladamente."

> **Ponto forte para citar:** o template do professor usava `@common/`, `usecase/` e `view/`. Eu preservei o template e implementei a aplicacao nas camadas que o enunciado pede, que e o cenario real de quem pega uma base de codigo existente.

---

## 3. Modelagem do banco (1:45 – 3:15)

**Mostrar:** o diagrama ER no DBeaver (ou a imagem em `docs/`).

**Falar:**

> "Sao seis tabelas: `funcionarios`, `autores`, `clientes`, `livros`, `livro_autor` e `emprestimos`.
>
> O `livro_autor` e a tabela associativa que resolve o **N:N**: um livro pode ter varios autores e um autor pode ter varios livros. A chave primaria e composta pelos dois IDs."

**Mostrar:** abrir [src/database/schema.sql](src/database/schema.sql) e rolar pelas constraints.

**Falar:**

> "O modelo nao confia so na aplicacao. Tem `CHECK` garantindo que a quantidade disponivel nunca passa do total nem fica negativa, `UNIQUE` no ISBN e no email, e as chaves estrangeiras usam `ON DELETE` coerente: `RESTRICT` onde apagar quebraria historico, `CASCADE` no vinculo livro-autor."

**Mostrar:** as funcoes de trigger no fim do arquivo.

**Falar:**

> "E o ponto que eu mais gostei: a baixa e a reposicao de estoque ficam em **triggers**. Quando um emprestimo e inserido, o trigger desconta um exemplar; se nao houver exemplar, ele levanta uma excecao e o insert nao acontece. Isso mantem a regra valida mesmo se alguem alterar a tabela por fora da aplicacao."

---

## 4. Execucao e CRUD (3:15 – 5:00)

**Mostrar:** terminal, rodar `npm run dev`.

**Falar:**

> "A aplicacao le as credenciais do `.env` via `dotenv` — nada de credencial no codigo. Ela testa a conexao antes de abrir o menu."

**Demonstrar, sem pressa:**

1. **Autores → Listar** — mostra os 4 do seed
2. **Livros → Listar** — mostra titulo, autores concatenados e `disponiveis/total`

**Falar sobre a listagem de livros:**

> "Repare que a listagem ja traz os autores de cada livro. Isso e um `LEFT JOIN` com `ARRAY_AGG` numa consulta so — nao e uma consulta por livro dentro de um laco."

3. **Livros → Cadastrar** um livro com **dois autores** (ex.: IDs `1, 3`)

**Falar:**

> "Aqui entra o N:N na pratica. Gravar esse livro sao duas operacoes: inserir em `livros` e inserir os vinculos em `livro_autor`. As duas rodam dentro de uma **transacao** — `BEGIN`, `COMMIT`, e `ROLLBACK` se qualquer uma falhar. Sem isso eu poderia acabar com um livro sem autor nenhum."

---

## 5. Emprestimo e devolucao — o coracao do projeto (5:00 – 7:00)

**Antes:** deixar visivel no DBeaver a query
`SELECT titulo, quantidade_total, quantidade_disponivel FROM livros ORDER BY titulo;`

**Demonstrar:**

1. No DBeaver, rodar a query e **mostrar a quantidade disponivel** de um livro
2. Na CLI: **Emprestimos → Registrar emprestimo** (informar ID do livro e do cliente)
3. Voltar ao DBeaver e **rodar a query de novo** — a quantidade caiu 1

**Falar:**

> "Eu nao escrevi nenhum UPDATE na quantidade. Quem fez isso foi o trigger no banco.
>
> E tem uma protecao a mais: antes de inserir, o repository da um `SELECT ... FOR UPDATE` na linha do livro. Isso bloqueia a linha ate o commit. Sem esse bloqueio, dois atendentes retirando o ultimo exemplar ao mesmo tempo poderiam ler 'disponivel = 1' juntos e o acervo ficaria negativo."

4. **Emprestimos → Listar em aberto** — mostra livro, cliente, data e status
5. **Emprestimos → Registrar devolucao** do emprestimo criado
6. No DBeaver, rodar a query mais uma vez — **a quantidade voltou**

**Falar:**

> "A devolucao so muda o status para DEVOLVIDO. O trigger de update carimba a data da devolucao e repoe o exemplar no acervo."

---

## 6. Tratamento de erros — minimo 3 situacoes (7:00 – 8:30)

> **Exigencia da rubrica:** demonstrar pelo menos **tres** situacoes de erro. Faca quatro para garantir.

**Demonstrar, uma de cada tipo:**

| #   | Onde                       | O que digitar      | O que dizer                                                          |
| --- | -------------------------- | ------------------ | -------------------------------------------------------------------- |
| 1   | Autores → Consultar por ID | `abc`              | "Validacao de entrada: o ID nem chega ao banco."                     |
| 2   | Autores → Consultar por ID | `9999`             | "Registro inexistente: o service devolve erro de dominio tratado."   |
| 3   | Emprestimos → Registrar    | livro sem exemplar | "Regra de negocio: o livro existe, mas nao ha exemplar disponivel."  |
| 4   | Livros → Cadastrar         | ISBN ja cadastrado | "Duplicidade: protegida por UNIQUE no banco e tratada na aplicacao." |

**Falar depois dos quatro:**

> "Em nenhum caso a aplicacao quebrou. Ela mostra a mensagem, espera o ENTER e volta ao menu.
>
> Isso e proposital: eu separo **erro de negocio** de **erro tecnico**. Erros previsiveis viram uma classe `DomainError`, e o controller mostra a mensagem amigavel. Qualquer outra coisa cai no ramo de erro inesperado. E a mesma separacao que se usa numa API de verdade para decidir entre um 400 e um 500."

> **Bonus se sobrar tempo:** remover um autor e tentar cadastra-lo de novo. Explicar que o indice unico do nome e **parcial** (`WHERE ativo = TRUE`), entao o nome volta a ficar livre. Ja o email de cliente continua reservado mesmo apos a remocao, porque email identifica uma pessoa — nome de autor nao.

---

## 7. Encerramento limpo (8:30 – 9:00)

**Demonstrar:** sair com `0` no menu de emprestimos e `0` no menu principal.

**Falar:**

> "Repare que o processo encerrou sozinho e o prompt voltou. Isso e o `pool.end()` sendo chamado num bloco `finally` — ele roda mesmo se a aplicacao falhar no meio.
>
> Se o pool ficasse aberto, cada execucao consumiria um slot de conexao do PostgreSQL ate estourar o limite do servidor. Em producao, esse e o tipo de vazamento que derruba o banco para todos os sistemas."

---

## 8. Fechamento — desafios, aprendizados e melhorias (9:00 – 10:00)

**Falar (adaptar com as suas palavras — nao decorar):**

**Desafios:**

> "O maior desafio foi decidir **onde** cada regra deveria morar. A disponibilidade do livro fica na aplicacao ou no banco? Eu acabei colocando nos dois: o service valida antes, para dar mensagem clara, e o trigger garante, para o dado nunca ficar inconsistente.
>
> Outro desafio foi o soft delete. Eu tinha um indice unico global no nome do autor, mas as consultas filtravam so os ativos. Depois de remover um autor, o sistema achava que o nome estava livre e o banco rejeitava — a aplicacao quebrava com stack trace. Corrigi tornando o indice parcial e tratando o codigo de erro 23505."

**Aprendizados:**

> "Aprendi na pratica por que transacao existe. Enquanto era um INSERT so, parecia teoria; quando virou 'inserir o livro e depois os autores', ficou obvio que sem `ROLLBACK` eu teria dado sujo no banco.
>
> Tambem entendi a diferenca entre validar e confiar: validar antes da mensagem boa, mas a garantia real tem que estar na constraint."

**Melhorias futuras:**

> "Autenticacao de funcionario com senha com hash de verdade; testes automatizados no repositorio; relatorio de multa por atraso; e uma biblioteca de CLI para navegar com as setas em vez de digitar numero."

---

## Erros comuns na gravacao — evitar

- Ler o roteiro palavra por palavra (soa decorado; use como guia)
- Ficar em silencio enquanto digita — narre o que esta fazendo
- Passar rapido pelo trecho de erros: e o que a rubrica cobra explicitamente
- Esquecer de mostrar o **antes e depois** no DBeaver no emprestimo — e a prova visual do criterio 8
- Estourar 10 minutos: se estiver longo, corte a parte 2 (arquitetura) para 40 segundos

## Publicacao

- YouTube **nao listado**, Google Drive ou OneDrive
- Conferir que o link abre em janela anonima (permissao de acesso)
- Entregar no AVA: link do repositorio publico + link do video
