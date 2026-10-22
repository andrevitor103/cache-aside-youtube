const express = require("express");
const { buscarPermissoesPorUsuario } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/permission", async (req, res) => {
  const user = Number(req.query.user);

  if (!Number.isInteger(user) || user <= 0) {
    return res.status(400).json({
      erro: "Parâmetro user é obrigatório e deve ser um inteiro positivo.",
    });
  }

  try {
    console.time(`db:user=${user}`);
    const permissions = await buscarPermissoesPorUsuario(user);
    console.timeEnd(`db:user=${user}`);

    return res.json({
      user,
      total: permissions.length,
      permissions,
    });
  } catch (error) {
    console.error("Erro ao buscar permissões:", error.message);
    return res.status(500).json({
      erro: "Erro ao buscar permissões no banco.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  console.log(
    `Exemplo: GET http://localhost:${PORT}/permission?user=1`
  );
});
