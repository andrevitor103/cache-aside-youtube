CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissoes (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario_permissoes (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  permissao_id INTEGER NOT NULL REFERENCES permissoes(id),
  PRIMARY KEY (usuario_id, permissao_id)
);

INSERT INTO usuarios (id, nome) VALUES
  (1, 'Ana'),
  (2, 'Bruno'),
  (3, 'Carla');

INSERT INTO permissoes (id, codigo, descricao) VALUES
  (1, 'pedidos:ler', 'Visualizar pedidos'),
  (2, 'pedidos:escrever', 'Criar e editar pedidos'),
  (3, 'relatorios:ler', 'Visualizar relatórios');

INSERT INTO usuario_permissoes (usuario_id, permissao_id) VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (2, 1);

SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));
SELECT setval('permissoes_id_seq', (SELECT MAX(id) FROM permissoes));
