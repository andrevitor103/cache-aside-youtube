# Cache-aside — API de permissões

Exemplo usado no vídeo sobre **cache-aside** no YouTube.

A API lista as permissões de um usuário com o padrão **cache-aside** (Redis + PostgreSQL).

## Specs

| Spec | Conteúdo |
| --- | --- |
| [`specs/001-permissions-without-cache.md`](specs/001-permissions-without-cache.md) | Domínio de permissões (baseline) |
| [`specs/002-cache-aside-permissions.md`](specs/002-cache-aside-permissions.md) | Cache-aside com TTL de 5 minutos |

## Como funciona

1. A aplicação procura o resultado no Redis.
2. Se não encontrar (**cache miss**), busca no PostgreSQL, devolve a resposta e grava no cache com TTL de **300s**.
3. Na próxima requisição igual (**cache hit**), responde pelo Redis e não consulta o banco.

A resposta inclui `source: "db"` ou `source: "cache"` para ficar óbvio na demo. No terminal aparecem `cache:hit` / `cache:miss` e o tempo da query no miss (`console.time`).

Chave Redis: `permission:user:{userId}`  
TTL default: `300` (override com `CACHE_TTL_SECONDS`)

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- [Docker](https://www.docker.com/) com Docker Compose

## Como subir

```bash
npm install
npm run db:up
npm run dev
```

- `npm run db:up` sobe PostgreSQL e Redis.
- `npm run dev` sobe a API em [http://localhost:3000](http://localhost:3000).
- `npm start` sobe a API sem watch.

Para parar:

```bash
npm run db:down
```

## Testar

Primeira chamada (miss → banco):

```bash
curl "http://localhost:3000/permission?user=1"
```

Segunda chamada (hit → cache):

```bash
curl "http://localhost:3000/permission?user=1"
```

Conferir TTL no Redis:

```bash
docker exec cache-aside-redis redis-cli TTL permission:user:1
```

`user` é obrigatório e precisa ser um inteiro positivo.

Permissões de exemplo:

| user | nome | permissões |
| --- | --- | --- |
| 1 | Ana | `pedidos:ler`, `pedidos:escrever`, `relatorios:ler` |
| 2 | Bruno | `pedidos:ler` |
| 3 | Carla | _(nenhuma)_ |

Credenciais locais do Postgres: usuário `permissoes`, senha `permissoes`, database `permissoes`, porta `5432`.  
Redis: `redis://localhost:6379`.
