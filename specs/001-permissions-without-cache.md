# Spec 001 — Domínio de permissões (sem cache)

**Status:** done  

**Branch sugerida:** `feat/permissions-sem-cache`  
**Cache-aside:** fora de escopo nesta entrega

## 1. Contexto

O projeto continua sendo a base do vídeo sobre **cache-aside**, mas o domínio muda de pedidos para **permissões de usuário**.

Motivo didático: permissões são lidas com frequência para o mesmo `user`, o que torna o cache-aside natural na próxima etapa.

Esta entrega é só a baseline: **toda requisição consulta o PostgreSQL**.

## 2. Objetivo

Substituir a API de pedidos por uma API de permissões, mantendo o stack atual (Node.js + Express + PostgreSQL via Docker), ainda **sem cache**.

## 3. Fora de escopo

- Redis / qualquer camada de cache
- Autenticação / JWT
- CRUD de permissões (só leitura)
- Alterar o nome do repositório `cache-aside-youtube`

## 4. Requisitos funcionais

### RF-01 — Rota de leitura

- Método: `GET`
- Path: `/permission`
- Query obrigatória: `user` (inteiro positivo)
- Exemplo: `GET /permission?user=1`

### RF-02 — Comportamento

1. Validar `user`.
2. Buscar no PostgreSQL as permissões do usuário.
3. Logar o tempo da consulta com `console.time` / `console.timeEnd`.
4. Retornar JSON com o usuário, o total e a lista.

### RF-03 — Remover domínio antigo

- Remover rota `/pedidos` e tabela/seed de pedidos.
- Atualizar README e textos do projeto para o novo domínio.

## 5. Contrato da API

### Request

| Param | Tipo | Obrigatório | Regra |
| --- | --- | --- | --- |
| `user` | integer | sim | inteiro > 0 |

### Response 200

```json
{
  "user": 1,
  "total": 3,
  "permissions": [
    {
      "id": 1,
      "codigo": "pedidos:ler",
      "descricao": "Visualizar pedidos"
    }
  ]
}
```

### Response 400

```json
{
  "erro": "Parâmetro user é obrigatório e deve ser um inteiro positivo."
}
```

### Response 500

```json
{
  "erro": "Erro ao buscar permissões no banco."
}
```

Usuário sem permissões: `200` com `total: 0` e `permissions: []`.

## 6. Modelo de dados

Postgres local (Docker):

| Campo | Valor |
| --- | --- |
| user | `permissoes` |
| password | `permissoes` |
| database | `permissoes` |
| port | `5432` |

### Tabelas

```sql
usuarios (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL
)

permissoes (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL
)

usuario_permissoes (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  permissao_id INTEGER NOT NULL REFERENCES permissoes(id),
  PRIMARY KEY (usuario_id, permissao_id)
)
```

### Seed mínimo

| user | permissões |
| --- | --- |
| 1 (Ana) | `pedidos:ler`, `pedidos:escrever`, `relatorios:ler` |
| 2 (Bruno) | `pedidos:ler` |
| 3 (Carla) | _(nenhuma)_ |

## 7. Critérios de aceite

- [x] `GET /permission?user=1` retorna as 3 permissões da Ana
- [x] `GET /permission?user=3` retorna lista vazia
- [x] `GET /permission` (sem `user`) retorna 400
- [x] `GET /pedidos` não existe mais
- [x] Subir com `npm run db:up` + `npm start` funciona do zero
- [x] README descreve o domínio de permissões e o exemplo curl
- [x] Nenhum código de cache foi introduzido

## 8. Plano de implementação

1. Atualizar `docker-compose.yml` e `db/init.sql`
2. Trocar `src/db.js` para buscar permissões por `user`
3. Trocar `src/index.js` para `GET /permission`
4. Atualizar `package.json` description e README
5. Recriar o volume do Postgres (credenciais/DB mudaram) e validar com curl
