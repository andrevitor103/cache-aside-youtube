# Cache-aside — API de pedidos

Exemplo usado no vídeo sobre **cache-aside** no YouTube.

A API lista pedidos de um cliente filtrados por status. O ponto da demo é comparar a mesma consulta indo sempre ao banco com a versão que passa pelo cache.

## Objetivo

Mostrar o padrão **cache-aside** em uma leitura que se repete:

1. A aplicação procura o resultado no cache.
2. Se não encontrar (**cache miss**), busca no PostgreSQL, devolve a resposta e grava o resultado no cache.
3. Na próxima requisição igual (**cache hit**), responde pelo cache e não consulta o banco.

O repositório está dividido em duas branches para o vídeo acompanhar o antes e o depois:

| Branch | O que tem |
| --- | --- |
| `main` | Sem cache. Toda requisição em `GET /pedidos` consulta o PostgreSQL. |
| `com-cache` | Com cache-aside. A mesma rota tenta o cache antes de ir ao banco. |

O tempo de cada consulta aparece no terminal da API (`console.time`), para ficar visível a diferença entre as duas versões.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- [Docker](https://www.docker.com/) com Docker Compose

## Como subir

Na branch que você quer demonstrar (`main` ou `com-cache`):

```bash
npm install
npm run db:up
npm run dev
```

- `npm run db:up` sobe o PostgreSQL (`postgres:16`) e carrega os pedidos de exemplo em `db/init.sql`.
- `npm run dev` sobe a API em [http://localhost:3000](http://localhost:3000) e reinicia ao salvar os arquivos.
- `npm start` sobe a API sem o modo watch.

Para parar o banco:

```bash
npm run db:down
```

## Testar

```bash
curl "http://localhost:3000/pedidos?clienteId=1&status=pendente"
```

`clienteId` é obrigatório e precisa ser um inteiro positivo. `status` é opcional e, se omitido, vale `pendente`.

Pedidos de exemplo já inseridos:

| clienteId | status |
| --- | --- |
| 1 | `pendente`, `pago` |
| 2 | `pendente`, `cancelado` |
| 3 | `pendente` |

Credenciais locais do banco (já usadas pela API se as variáveis de ambiente não forem definidas): usuário `pedidos`, senha `pedidos`, database `pedidos`, porta `5432`.
