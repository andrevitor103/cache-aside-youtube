const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "pedidos",
  password: process.env.DB_PASSWORD || "pedidos",
  database: process.env.DB_NAME || "pedidos",
});

async function buscarPedidosPorClienteEStatus(clienteId, status) {
  const result = await pool.query(
    `
      SELECT
        id,
        cliente_id AS "clienteId",
        descricao,
        valor::float8 AS valor,
        status,
        criado_em AS "criadoEm"
      FROM pedidos
      WHERE cliente_id = $1 AND status = $2
      ORDER BY id
    `,
    [clienteId, status]
  );

  return result.rows;
}

module.exports = {
  pool,
  buscarPedidosPorClienteEStatus,
};
