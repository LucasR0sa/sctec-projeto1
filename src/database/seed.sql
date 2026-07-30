BEGIN;

INSERT INTO funcionarios (nome, matricula, email, senha_hash)
VALUES
  ('Lucas Rosa', 'FUNC-001', 'lucas@bookstore.local', 'hash-demo-123'),
  ('Ana Martins', 'FUNC-002', 'ana@bookstore.local', 'hash-demo-456')
ON CONFLICT (matricula) DO UPDATE
SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  senha_hash = EXCLUDED.senha_hash,
  ativo = TRUE;

INSERT INTO autores (nome, nacionalidade, data_nascimento, biografia)
VALUES
  ('Machado de Assis', 'Brasileira', '1839-06-21', 'Autor classico da literatura brasileira.'),
  ('Clarice Lispector', 'Brasileira', '1920-12-10', 'Autora conhecida por narrativas introspectivas.'),
  ('George Orwell', 'Britanica', '1903-06-25', 'Autor de obras distopicas e politicas.'),
  ('Robert C. Martin', 'Estadunidense', '1952-12-05', 'Autor de livros sobre boas praticas de software.')
ON CONFLICT DO NOTHING;

INSERT INTO clientes (nome, email, telefone, documento)
VALUES
  ('Beatriz Lima', 'beatriz@email.com', '11999990001', '12345678901'),
  ('Carlos Souza', 'carlos@email.com', '11999990002', '98765432100'),
  ('Fernanda Alves', 'fernanda@email.com', '11999990003', '45678912300')
ON CONFLICT (email) DO UPDATE
SET
  nome = EXCLUDED.nome,
  telefone = EXCLUDED.telefone,
  documento = EXCLUDED.documento,
  ativo = TRUE;

INSERT INTO livros (
  titulo,
  isbn,
  editora,
  categoria,
  ano_publicacao,
  quantidade_total,
  quantidade_disponivel
)
VALUES
  ('Dom Casmurro', '9788535910663', 'Companhia das Letras', 'Romance', 1899, 3, 3),
  ('A Hora da Estrela', '9788535914845', 'Rocco', 'Romance', 1977, 2, 2),
  ('1984', '9780451524935', 'Companhia Editora Nacional', 'Distopia', 1949, 4, 4),
  ('Clean Code', '9780132350884', 'Prentice Hall', 'Tecnologia', 2008, 2, 2)
ON CONFLICT (isbn) DO UPDATE
SET
  titulo = EXCLUDED.titulo,
  editora = EXCLUDED.editora,
  categoria = EXCLUDED.categoria,
  ano_publicacao = EXCLUDED.ano_publicacao,
  quantidade_total = EXCLUDED.quantidade_total,
  quantidade_disponivel = LEAST(livros.quantidade_disponivel, EXCLUDED.quantidade_total),
  ativo = TRUE;

INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id
FROM livros l
JOIN autores a ON a.nome = 'Machado de Assis'
WHERE l.isbn = '9788535910663'
ON CONFLICT (livro_id, autor_id) DO NOTHING;

INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id
FROM livros l
JOIN autores a ON a.nome = 'Clarice Lispector'
WHERE l.isbn = '9788535914845'
ON CONFLICT (livro_id, autor_id) DO NOTHING;

INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id
FROM livros l
JOIN autores a ON a.nome = 'George Orwell'
WHERE l.isbn = '9780451524935'
ON CONFLICT (livro_id, autor_id) DO NOTHING;

INSERT INTO livro_autor (livro_id, autor_id)
SELECT l.id, a.id
FROM livros l
JOIN autores a ON a.nome = 'Robert C. Martin'
WHERE l.isbn = '9780132350884'
ON CONFLICT (livro_id, autor_id) DO NOTHING;

INSERT INTO emprestimos (
  livro_id,
  cliente_id,
  funcionario_id,
  data_prevista_devolucao,
  observacao
)
SELECT
  l.id,
  c.id,
  f.id,
  CURRENT_DATE + 7,
  'Emprestimo inicial para demonstracao'
FROM livros l
JOIN clientes c ON c.email = 'beatriz@email.com'
JOIN funcionarios f ON f.matricula = 'FUNC-001'
WHERE l.isbn = '9780451524935'
  AND NOT EXISTS (
    SELECT 1
    FROM emprestimos e
    WHERE e.livro_id = l.id
      AND e.cliente_id = c.id
      AND e.status = 'ATIVO'
  );

COMMIT;