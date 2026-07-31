# Guia DBeaver

Use este roteiro para criar, visualizar e explicar o banco PostgreSQL do BookStore Manager CLI no DBeaver.

## 1. Criar o banco

Conecte no PostgreSQL pelo DBeaver usando o banco padrao `postgres` e execute:

```sql
CREATE DATABASE bookstore_manager;
```

Depois crie uma nova conexao apontando para:

```text
Host: localhost
Porta: 5432
Database: bookstore_manager
User: seu_usuario_postgres
Password: sua_senha_postgres
```

## 2. Rodar os scripts do projeto

Abra um editor SQL na conexao `bookstore_manager` e execute os arquivos nesta ordem:

1. `src/database/schema.sql`
2. `src/database/seed.sql`

O `schema.sql` recria tabelas, chaves, indices, triggers e views. Como ele derruba e recria as tabelas, use com cuidado quando ja houver dados reais.

## 3. Conferir se tudo foi criado

Execute:

```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_type, table_name;
```

A view `information_schema.tables` lista tabelas e views juntas, por isso a coluna `table_type`. Resultado esperado: 6 tabelas e 5 views.

```text
autores                            BASE TABLE
clientes                           BASE TABLE
emprestimos                        BASE TABLE
funcionarios                       BASE TABLE
livro_autor                        BASE TABLE
livros                             BASE TABLE
vw_clientes_com_emprestimos_ativos VIEW
vw_emprestimos_por_livro           VIEW
vw_livros_disponiveis              VIEW
vw_livros_emprestados              VIEW
vw_livros_por_autor                VIEW
```

Para ver apenas as tabelas, acrescente `AND table_type = 'BASE TABLE'`.

Depois confira os relatorios:

```sql
SELECT * FROM vw_livros_disponiveis;
SELECT * FROM vw_livros_emprestados;
SELECT * FROM vw_livros_por_autor;
SELECT * FROM vw_emprestimos_por_livro;
SELECT * FROM vw_clientes_com_emprestimos_ativos;
```

## 4. Testar a regra de devolucao

O seed cria um emprestimo ativo do livro `1984`. Para demonstrar a devolucao:

```sql
SELECT titulo, quantidade_total, quantidade_disponivel
FROM livros
WHERE isbn = '9780451524935';

UPDATE emprestimos
SET status = 'DEVOLVIDO', data_devolucao = NOW()
WHERE id = 1;

SELECT titulo, quantidade_total, quantidade_disponivel
FROM livros
WHERE isbn = '9780451524935';
```

A quantidade disponivel deve aumentar em 1 depois da devolucao.

## 5. Gerar imagem da modelagem

No DBeaver:

1. Expanda a conexao `bookstore_manager`.
2. Abra `Schemas > public > Tables`.
3. Selecione as tabelas principais.
4. Clique com o botao direito e escolha `View Diagram` ou `ER Diagram`.
5. Organize visualmente as tabelas.
6. Exporte como PNG para `docs/modelagem-bookstore.png`.

Depois adicione no README:

```md
![Modelagem do banco](docs/modelagem-bookstore.png)
```

Essa imagem e excelente para recrutadores e tambem facilita a explicacao no video.
