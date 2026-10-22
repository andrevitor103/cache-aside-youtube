CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO pedidos (cliente_id, descricao, valor, status) VALUES
  (1, 'Notebook', 4500.00, 'pendente'),
  (1, 'Mouse', 120.00, 'pendente'),
  (1, 'Teclado', 350.00, 'pago'),
  (2, 'Monitor', 1800.00, 'pendente'),
  (2, 'Headset', 499.90, 'cancelado'),
  (3, 'Cadeira gamer', 1299.00, 'pendente');
