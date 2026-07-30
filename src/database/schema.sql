BEGIN;

DROP VIEW IF EXISTS vw_clientes_com_emprestimos_ativos;
DROP VIEW IF EXISTS vw_emprestimos_por_livro;
DROP VIEW IF EXISTS vw_livros_por_autor;
DROP VIEW IF EXISTS vw_livros_emprestados;
DROP VIEW IF EXISTS vw_livros_disponiveis;

DROP TABLE IF EXISTS emprestimos CASCADE;
DROP TABLE IF EXISTS livro_autor CASCADE;
DROP TABLE IF EXISTS livros CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS autores CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;

CREATE TABLE funcionarios (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  matricula VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_funcionarios_nome CHECK (LENGTH(TRIM(nome)) >= 3),
  CONSTRAINT chk_funcionarios_email CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

CREATE TABLE autores (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  nacionalidade VARCHAR(80),
  data_nascimento DATE,
  biografia TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_autores_nome CHECK (LENGTH(TRIM(nome)) >= 3)
);

CREATE UNIQUE INDEX uq_autores_nome_normalizado
  ON autores (LOWER(TRIM(nome)));

CREATE TABLE clientes (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  telefone VARCHAR(20),
  documento VARCHAR(20) UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_clientes_nome CHECK (LENGTH(TRIM(nome)) >= 3),
  CONSTRAINT chk_clientes_email CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  CONSTRAINT chk_clientes_documento CHECK (
    documento IS NULL OR LENGTH(REGEXP_REPLACE(documento, '[^0-9]', '', 'g')) BETWEEN 11 AND 14
  )
);

CREATE TABLE livros (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  isbn VARCHAR(17) NOT NULL UNIQUE,
  editora VARCHAR(120),
  categoria VARCHAR(80),
  ano_publicacao INTEGER,
  quantidade_total INTEGER NOT NULL DEFAULT 1,
  quantidade_disponivel INTEGER NOT NULL DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_livros_titulo CHECK (LENGTH(TRIM(titulo)) >= 2),
  CONSTRAINT chk_livros_isbn CHECK (LENGTH(REGEXP_REPLACE(isbn, '[^0-9]', '', 'g')) IN (10, 13)),
  CONSTRAINT chk_livros_ano_publicacao CHECK (
    ano_publicacao IS NULL OR ano_publicacao BETWEEN 1000 AND 2100
  ),
  CONSTRAINT chk_livros_quantidade_total CHECK (quantidade_total > 0),
  CONSTRAINT chk_livros_quantidade_disponivel CHECK (
    quantidade_disponivel >= 0 AND quantidade_disponivel <= quantidade_total
  )
);

CREATE TABLE livro_autor (
  livro_id INTEGER NOT NULL,
  autor_id INTEGER NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (livro_id, autor_id),
  CONSTRAINT fk_livro_autor_livro
    FOREIGN KEY (livro_id)
    REFERENCES livros (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_livro_autor_autor
    FOREIGN KEY (autor_id)
    REFERENCES autores (id)
    ON DELETE RESTRICT
);

CREATE TABLE emprestimos (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  livro_id INTEGER NOT NULL,
  cliente_id INTEGER NOT NULL,
  funcionario_id INTEGER,
  data_emprestimo TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_prevista_devolucao DATE NOT NULL DEFAULT (CURRENT_DATE + 7),
  data_devolucao TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
  observacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_emprestimos_livro
    FOREIGN KEY (livro_id)
    REFERENCES livros (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_emprestimos_cliente
    FOREIGN KEY (cliente_id)
    REFERENCES clientes (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_emprestimos_funcionario
    FOREIGN KEY (funcionario_id)
    REFERENCES funcionarios (id)
    ON DELETE SET NULL,
  CONSTRAINT chk_emprestimos_status CHECK (status IN ('ATIVO', 'DEVOLVIDO', 'ATRASADO')),
  CONSTRAINT chk_emprestimos_previsao CHECK (data_prevista_devolucao >= data_emprestimo::DATE),
  CONSTRAINT chk_emprestimos_devolucao_status CHECK (
    (status = 'DEVOLVIDO' AND data_devolucao IS NOT NULL)
    OR (status <> 'DEVOLVIDO' AND data_devolucao IS NULL)
  )
);

CREATE UNIQUE INDEX uq_emprestimos_livro_cliente_ativo
  ON emprestimos (livro_id, cliente_id)
  WHERE status IN ('ATIVO', 'ATRASADO');

CREATE INDEX idx_livro_autor_autor_id ON livro_autor (autor_id);
CREATE INDEX idx_livros_titulo ON livros (LOWER(titulo));
CREATE INDEX idx_clientes_nome ON clientes (LOWER(nome));
CREATE INDEX idx_emprestimos_cliente_id ON emprestimos (cliente_id);
CREATE INDEX idx_emprestimos_livro_id ON emprestimos (livro_id);
CREATE INDEX idx_emprestimos_status ON emprestimos (status);

CREATE OR REPLACE FUNCTION definir_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_funcionarios_atualizado_em
BEFORE UPDATE ON funcionarios
FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TRIGGER trg_autores_atualizado_em
BEFORE UPDATE ON autores
FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TRIGGER trg_clientes_atualizado_em
BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TRIGGER trg_livros_atualizado_em
BEFORE UPDATE ON livros
FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE TRIGGER trg_emprestimos_atualizado_em
BEFORE UPDATE ON emprestimos
FOR EACH ROW EXECUTE FUNCTION definir_atualizado_em();

CREATE OR REPLACE FUNCTION baixar_disponibilidade_emprestimo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('ATIVO', 'ATRASADO') THEN
    UPDATE livros
       SET quantidade_disponivel = quantidade_disponivel - 1
     WHERE id = NEW.livro_id
       AND ativo = TRUE
       AND quantidade_disponivel > 0;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Livro indisponivel para emprestimo';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_emprestimos_baixar_disponibilidade
BEFORE INSERT ON emprestimos
FOR EACH ROW EXECUTE FUNCTION baixar_disponibilidade_emprestimo();

CREATE OR REPLACE FUNCTION devolver_disponibilidade_emprestimo()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.livro_id <> NEW.livro_id THEN
    RAISE EXCEPTION 'Nao e permitido alterar o livro de um emprestimo';
  END IF;

  IF OLD.status IN ('ATIVO', 'ATRASADO') AND NEW.status = 'DEVOLVIDO' THEN
    NEW.data_devolucao = COALESCE(NEW.data_devolucao, NOW());

    UPDATE livros
       SET quantidade_disponivel = quantidade_disponivel + 1
     WHERE id = NEW.livro_id;
  END IF;

  IF OLD.status = 'DEVOLVIDO' AND NEW.status <> 'DEVOLVIDO' THEN
    RAISE EXCEPTION 'Nao e permitido reabrir emprestimo devolvido';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_emprestimos_devolver_disponibilidade
BEFORE UPDATE ON emprestimos
FOR EACH ROW EXECUTE FUNCTION devolver_disponibilidade_emprestimo();

CREATE VIEW vw_livros_disponiveis AS
SELECT
  l.id,
  l.titulo,
  l.isbn,
  l.quantidade_total,
  l.quantidade_disponivel,
  STRING_AGG(a.nome, ', ' ORDER BY a.nome) AS autores
FROM livros l
JOIN livro_autor la ON la.livro_id = l.id
JOIN autores a ON a.id = la.autor_id
WHERE l.ativo = TRUE
  AND l.quantidade_disponivel > 0
GROUP BY l.id;

CREATE VIEW vw_livros_emprestados AS
SELECT
  e.id AS emprestimo_id,
  l.titulo AS livro,
  c.nome AS cliente,
  f.nome AS funcionario,
  e.data_emprestimo,
  e.data_prevista_devolucao,
  e.status
FROM emprestimos e
JOIN livros l ON l.id = e.livro_id
JOIN clientes c ON c.id = e.cliente_id
LEFT JOIN funcionarios f ON f.id = e.funcionario_id
WHERE e.status IN ('ATIVO', 'ATRASADO')
ORDER BY e.data_emprestimo DESC;

CREATE VIEW vw_livros_por_autor AS
SELECT
  a.id AS autor_id,
  a.nome AS autor,
  COUNT(l.id) AS total_livros,
  STRING_AGG(l.titulo, ', ' ORDER BY l.titulo) AS livros
FROM autores a
LEFT JOIN livro_autor la ON la.autor_id = a.id
LEFT JOIN livros l ON l.id = la.livro_id
GROUP BY a.id, a.nome
ORDER BY total_livros DESC, a.nome;

CREATE VIEW vw_emprestimos_por_livro AS
SELECT
  l.id AS livro_id,
  l.titulo,
  COUNT(e.id) AS total_emprestimos,
  COUNT(e.id) FILTER (WHERE e.status IN ('ATIVO', 'ATRASADO')) AS emprestimos_ativos
FROM livros l
LEFT JOIN emprestimos e ON e.livro_id = l.id
GROUP BY l.id, l.titulo
ORDER BY total_emprestimos DESC, l.titulo;

CREATE VIEW vw_clientes_com_emprestimos_ativos AS
SELECT
  c.id AS cliente_id,
  c.nome AS cliente,
  c.email,
  COUNT(e.id) AS total_emprestimos_ativos,
  STRING_AGG(l.titulo, ', ' ORDER BY l.titulo) AS livros_emprestados
FROM clientes c
JOIN emprestimos e ON e.cliente_id = c.id
JOIN livros l ON l.id = e.livro_id
WHERE e.status IN ('ATIVO', 'ATRASADO')
GROUP BY c.id, c.nome, c.email
ORDER BY total_emprestimos_ativos DESC, c.nome;

COMMIT;