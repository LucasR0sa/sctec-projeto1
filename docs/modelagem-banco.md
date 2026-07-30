# Modelagem do Banco de Dados

Este modelo foi desenhado para o BookStore Manager CLI usando PostgreSQL, SQL nativo e arquitetura em camadas.

## Decisoes principais

- `livros` e `autores` possuem relacionamento N:N por meio de `livro_autor`.
- `emprestimos` registra o historico de retirada e devolucao de livros por clientes.
- `funcionarios` identifica o operador que registrou o emprestimo, ajudando na auditoria e na apresentacao em video.
- `quantidade_total` e `quantidade_disponivel` ficam em `livros`, com `CHECK` garantindo que a disponibilidade nunca seja negativa nem maior que o total.
- Triggers protegem a regra central do negocio: emprestar baixa a disponibilidade; devolver aumenta a disponibilidade.
- Views foram criadas para apoiar os relatorios exigidos no RF18.

## Diagrama ER

```mermaid
erDiagram
    FUNCIONARIOS ||--o{ EMPRESTIMOS : registra
    CLIENTES ||--o{ EMPRESTIMOS : realiza
    LIVROS ||--o{ EMPRESTIMOS : emprestado_em
    LIVROS ||--o{ LIVRO_AUTOR : possui
    AUTORES ||--o{ LIVRO_AUTOR : escreve

    FUNCIONARIOS {
        int id PK
        varchar nome
        varchar matricula UK
        varchar email UK
        varchar senha_hash
        boolean ativo
        timestamptz criado_em
        timestamptz atualizado_em
    }

    AUTORES {
        int id PK
        varchar nome UK
        varchar nacionalidade
        date data_nascimento
        text biografia
        boolean ativo
        timestamptz criado_em
        timestamptz atualizado_em
    }

    CLIENTES {
        int id PK
        varchar nome
        varchar email UK
        varchar telefone
        varchar documento UK
        boolean ativo
        timestamptz criado_em
        timestamptz atualizado_em
    }

    LIVROS {
        int id PK
        varchar titulo
        varchar isbn UK
        varchar editora
        varchar categoria
        int ano_publicacao
        int quantidade_total
        int quantidade_disponivel
        boolean ativo
        timestamptz criado_em
        timestamptz atualizado_em
    }

    LIVRO_AUTOR {
        int livro_id PK_FK
        int autor_id PK_FK
        timestamptz criado_em
    }

    EMPRESTIMOS {
        int id PK
        int livro_id FK
        int cliente_id FK
        int funcionario_id FK
        timestamptz data_emprestimo
        date data_prevista_devolucao
        timestamptz data_devolucao
        varchar status
        text observacao
        timestamptz criado_em
        timestamptz atualizado_em
    }
```

## Regras de integridade

- `funcionarios.matricula`, `funcionarios.email`, `clientes.email`, `clientes.documento` e `livros.isbn` sao unicos.
- `autores.nome` possui indice unico normalizado com `LOWER(TRIM(nome))`.
- `livro_autor` usa chave primaria composta para impedir autor repetido no mesmo livro.
- `emprestimos.status` aceita apenas `ATIVO`, `DEVOLVIDO` ou `ATRASADO`.
- Um cliente nao pode ter dois emprestimos ativos ou atrasados do mesmo livro ao mesmo tempo.
- Um emprestimo devolvido deve possuir `data_devolucao`.

## Relatorios ja suportados por views

- `vw_livros_disponiveis`
- `vw_livros_emprestados`
- `vw_livros_por_autor`
- `vw_emprestimos_por_livro`
- `vw_clientes_com_emprestimos_ativos`

## Uso no DBeaver

O roteiro de criacao do banco, execucao dos scripts e exportacao do diagrama ER esta em [`docs/dbeaver.md`](./dbeaver.md).

A imagem exportada pelo DBeaver deve ser salva preferencialmente em `docs/modelagem-bookstore.png` e referenciada no README.
