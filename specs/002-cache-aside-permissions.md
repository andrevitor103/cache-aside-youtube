# Spec 002 — Cache-aside em `/permission` (TTL 5 min)

**Status:** done  

**Branch:** `main` (somente)  
**Depende de:** `specs/001-permissions-without-cache.md`

## 1. Contexto

A baseline já lê permissões direto do PostgreSQL em `GET /permission?user=1`.

Agora adicionamos o padrão **cache-aside** com Redis, para a demo do vídeo mostrar cache miss (vai ao banco) e cache hit (responde pelo Redis).

## 2. Objetivo

Na rota `GET /permission`, aplicar cache-aside com TTL de **5 minutos**, sem mudar o contrato público da API (campos `user`, `total`, `permissions`).

## 3. Fora de escopo

- Invalidação ativa (write-through / delete on update)
- Outras rotas além de `/permission`
- Branch separada (`com-cache`); tudo entra na `main`
- Troca de domínio ou schema do Postgres

## 4. Padrão cache-aside

Para cada request válida:

1. Montar a chave de cache.
2. Ler no Redis (**GET**).
3. **Cache hit:** deserializar e devolver a resposta. Não consultar o Postgres.
4. **Cache miss:** consultar o Postgres, montar a resposta, gravar no Redis com TTL (**SET** + expire) e devolver.

Se o Redis estiver indisponível: falhar a request com `500` e mensagem clara (fail-fast, sem silenciar o erro). Isso evita esconder problema de infra na demo.

## 5. Requisitos

### RF-01 — Redis no Docker Compose

- Serviço `redis` (imagem `redis:7-alpine`)
- Porta host `6379`
- Container name: `cache-aside-redis`
- `npm run db:up` sobe Postgres **e** Redis

### RF-02 — Chave e TTL

| Item | Valor |
| --- | --- |
| Chave | `permission:user:{userId}` |
| Valor | JSON da resposta (`user`, `total`, `permissions`) |
| TTL | `300` segundos (5 minutos) |

TTL configurável via env `CACHE_TTL_SECONDS` (default `300`).

### RF-03 — Observabilidade para o vídeo

Logs no terminal:

- cache hit: `cache:hit user={id}`
- cache miss: `cache:miss user={id}` + manter `console.time` / `console.timeEnd` da consulta ao banco

Campo extra na resposta JSON (somente para a demo):

```json
{
  "user": 1,
  "total": 3,
  "permissions": [],
  "source": "cache"
}
```

`source` ∈ `"cache" | "db"`.

### RF-04 — Código

- Novo módulo `src/cache.js` (cliente Redis + get/set)
- `src/index.js` orquestra o cache-aside
- `src/db.js` permanece responsável só pelo Postgres
- Dependência: pacote `redis` (node-redis)

## 6. Contrato da API (delta)

Mantém o contrato da spec 001 e adiciona:

| Campo | Tipo | Quando |
| --- | --- | --- |
| `source` | `"cache"` \| `"db"` | sempre no 200 |

Erros:

- Redis fora: `500` `{ "erro": "Erro ao acessar o cache." }`
- Postgres fora (após miss): `500` `{ "erro": "Erro ao buscar permissões no banco." }`

## 7. Critérios de aceite

- [x] Redis sobe com `npm run db:up`
- [x] 1ª chamada `GET /permission?user=1` → `source: "db"` e grava no Redis
- [x] 2ª chamada imediata → `source: "cache"` e **não** loga `db:user=1` com consulta
- [x] Chave no Redis: `permission:user:1` com TTL ≈ 300s
- [x] TTL default = 300; override por `CACHE_TTL_SECONDS`
- [x] README atualizado com Redis, fluxo hit/miss e exemplo curl
- [x] Entrega apenas na `main`

## 8. Plano de implementação

1. Escrever esta spec + card no Trello
2. Atualizar `docker-compose.yml` com Redis
3. `npm install redis`
4. Criar `src/cache.js`
5. Aplicar cache-aside em `src/index.js`
6. Atualizar README e scripts se necessário
7. Validar hit/miss com curl + `redis-cli TTL`
