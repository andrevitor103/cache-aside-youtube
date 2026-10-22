const express = require("express");
const { buscarPermissoesPorUsuario } = require("./db");
const {
  conectarCache,
  chavePermissaoUsuario,
  getJson,
  setJson,
  CACHE_TTL_SECONDS,
} = require("./cache");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/permission", async (req, res) => {
  const user = Number(req.query.user);

  if (!Number.isInteger(user) || user <= 0) {
    return res.status(400).json({
      erro: "Parâmetro user é obrigatório e deve ser um inteiro positivo.",
    });
  }

  const chave = chavePermissaoUsuario(user);

  let cached;
  try {
    cached = await getJson(chave);
  } catch (error) {
    console.error("Erro ao ler cache:", error.message);
    return res.status(500).json({ erro: "Erro ao acessar o cache." });
  }

  if (cached) {
    console.log(`cache:hit user=${user}`);
    return res.json({
      ...cached,
      source: "cache",
    });
  }

  console.log(`cache:miss user=${user}`);

  let permissions;
  try {
    console.time(`db:user=${user}`);
    permissions = await buscarPermissoesPorUsuario(user);
    console.timeEnd(`db:user=${user}`);
  } catch (error) {
    console.error("Erro ao buscar permissões:", error.message);
    return res.status(500).json({
      erro: "Erro ao buscar permissões no banco.",
    });
  }

  const payload = {
    user,
    total: permissions.length,
    permissions,
  };

  try {
    await setJson(chave, payload);
  } catch (error) {
    console.error("Erro ao gravar cache:", error.message);
    return res.status(500).json({ erro: "Erro ao acessar o cache." });
  }

  return res.json({
    ...payload,
    source: "db",
  });
});

async function iniciar() {
  await conectarCache();

  app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
    console.log(`Cache TTL: ${CACHE_TTL_SECONDS}s`);
    console.log(
      `Exemplo: GET http://localhost:${PORT}/permission?user=1`
    );
  });
}

iniciar().catch((error) => {
  console.error("Falha ao iniciar a API:", error.message);
  process.exit(1);
});
