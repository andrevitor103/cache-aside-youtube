const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "permissoes",
  password: process.env.DB_PASSWORD || "permissoes",
  database: process.env.DB_NAME || "permissoes",
});

async function buscarPermissoesPorUsuario(userId) {
  const result = await pool.query(
    `
      SELECT
        p.id,
        p.codigo,
        p.descricao
      FROM permissoes p
      INNER JOIN usuario_permissoes up ON up.permissao_id = p.id
      WHERE up.usuario_id = $1
      ORDER BY p.id
    `,
    [userId]
  );

  return result.rows;
}

module.exports = {
  pool,
  buscarPermissoesPorUsuario,
};
