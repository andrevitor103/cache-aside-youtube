const { createClient } = require("redis");

const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 300;

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (error) => {
  console.error("Redis error:", error.message);
});

async function conectarCache() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

function chavePermissaoUsuario(userId) {
  return `permission:user:${userId}`;
}

async function getJson(chave) {
  const valor = await redis.get(chave);
  if (valor == null) {
    return null;
  }
  return JSON.parse(valor);
}

async function setJson(chave, valor, ttlSeconds = CACHE_TTL_SECONDS) {
  await redis.set(chave, JSON.stringify(valor), { EX: ttlSeconds });
}

module.exports = {
  redis,
  CACHE_TTL_SECONDS,
  conectarCache,
  chavePermissaoUsuario,
  getJson,
  setJson,
};
