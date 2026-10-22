# Cache-aside — API de permissões

Exemplo usado no vídeo sobre **cache-aside** no YouTube.

A API lista as permissões de um usuário. O ponto da demo é comparar a mesma consulta indo sempre ao banco com a versão que passa pelo cache.

## Spec atual

Esta entrega segue a spec SDD em [`specs/001-permissions-without-cache.md`](specs/001-permissions-without-cache.md): domínio de permissões **sem cache**.

## Objetivo

Mostrar o padrão **cache-aside** em uma leitura que se repete:

1. A aplicação procura o resultado no cache.
2. Se não encontrar (**cache miss**), busca no PostgreSQL, devolve a resposta e grava o resultado no cache.
3. Na próxima requisição igual (**cache hit**), responde pelo cache e não consulta o banco.

Nesta branch/base: **sem cache**. Toda requisição em `GET /permission` consulta o PostgreSQL.

O tempo de cada consulta aparece no terminal da API (`console.time`), para ficar visível a diferença quando o cache for adicionado.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- [Docker](https://www.docker.com/) com Docker Compose

## Como subir

```bash
npm install
npm run db:up
npm run dev
```

- `npm run db:up` sobe o PostgreSQL (`postgres:16`) e carrega o seed em `db/init.sql`.
- `npm run dev` sobe a API em [http://localhost:3000](http://localhost:3000) e reinicia ao salvar os arquivos.
- `npm start` sobe a API sem o modo watch.

Se você já tinha o container antigo (domínio de pedidos), recrie o volume:

```bash
npm run db:down
docker volume ls | grep cache-aside
docker compose down -v
npm run db:up
```

Para parar o banco:

```bash
npm run db:down
```

## Testar

```bash
curl "http://localhost:3000/permission?user=1"
```

`user` é obrigatório e precisa ser um inteiro positivo.

Permissões de exemplo:

| user | nome | permissões |
| --- | --- | --- |
| 1 | Ana | `pedidos:ler`, `pedidos:escrever`, `relatorios:ler` |
| 2 | Bruno | `pedidos:ler` |
| 3 | Carla | _(nenhuma)_ |

Credenciais locais do banco (já usadas pela API se as variáveis de ambiente não forem definidas): usuário `permissoes`, senha `permissoes`, database `permissoes`, porta `5432`.
