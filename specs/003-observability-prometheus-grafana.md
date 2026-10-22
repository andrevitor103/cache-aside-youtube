# Spec 003 — Observabilidade (Prometheus + Grafana)

**Status:** done  
**Branch:** `main`  
**Depende de:** `specs/002-cache-aside-permissions.md`

## 1. Contexto

Com cache-aside em `/permission`, a demo do vídeo precisa **visualizar** hit vs miss e a diferença de latência — não só logs no terminal.

Esta entrega adiciona métricas Prometheus na API e sobe Prometheus + Grafana via Docker Compose, com dashboard provisionado.

Registro feito após a implementação (caminho inverso / SDD retroativo do que já está no código).

## 2. Objetivo

Expor métricas de `GET /permission`, coletá-las com Prometheus e exibi-las no Grafana, focando na história didática do cache-aside.

## 3. Fora de escopo

- Alertmanager / alertas
- Tracing (OpenTelemetry, Jaeger, etc.)
- Logs centralizados (Loki, ELK)
- Colocar a API dentro do Docker (continua rodando no host)
- Autenticação avançada no Grafana (basta admin local + anonymous Viewer)
- Métricas de Redis/Postgres exporters

## 4. Requisitos funcionais

### RF-01 — Endpoint `/metrics`

- A API expõe `GET /metrics` no formato Prometheus (text exposition).
- Dependência: `prom-client`.
- Módulo dedicado: `src/metrics.js`.

### RF-02 — Métricas de negócio (cache-aside)

| Métrica | Tipo | Labels | Uso |
| --- | --- | --- | --- |
| `cache_aside_permission_requests_total` | Counter | `source` | Contagem por origem |
| `cache_aside_permission_duration_seconds` | Histogram | `source` | Latência por origem |

Valores de `source`:

| Valor | Quando |
| --- | --- |
| `cache` | cache hit |
| `db` | cache miss (foi ao Postgres) |
| `error_cache` | falha ao ler/gravar Redis |
| `error_db` | falha no Postgres |
| `bad_request` | `user` inválido / ausente |

Também coletar default metrics do Node (`collectDefaultMetrics`) — secundário para a demo.

### RF-03 — Prometheus no Docker Compose

- Serviço `prometheus` (imagem `prom/prometheus`)
- Porta host: `9090`
- Config: `monitoring/prometheus.yml`
- Scrape a cada **5s** do job `cache-aside-api`
- Target: `host.docker.internal:3000` + path `/metrics`
- `extra_hosts: host.docker.internal:host-gateway` (Linux)

### RF-04 — Grafana no Docker Compose

- Serviço `grafana` (imagem `grafana/grafana`)
- Porta host: `3001` → container `3000` (evita conflito com a API)
- Credenciais: `admin` / `admin`
- Anonymous Viewer habilitado (facilita a demo)
- Provisioning:
  - Datasource Prometheus → `http://prometheus:9090` (`uid: prometheus`)
  - Provider de dashboards apontando para `/var/lib/grafana/dashboards`

### RF-05 — Dashboard

Arquivo: `monitoring/grafana/dashboards/cache-aside.json`  
Título: **Cache Aside — Permissions**  
UID: `cache-aside-permissions`  
Pasta Grafana: **Cache Aside**

Painéis mínimos:

1. Cache hit ratio (`cache / (cache + db)`)
2. Requests/s hit vs miss
3. Latência p95 por `source` (`cache` \| `db`)
4. Totais por origem (increase 1m)

## 5. Layout de arquivos

```
monitoring/
├── prometheus.yml
└── grafana/
    ├── dashboards/
    │   └── cache-aside.json
    └── provisioning/
        ├── datasources/
        │   └── datasource.yml
        └── dashboards/
            └── dashboards.yml
```

## 6. Critérios de aceite

- [x] `GET /metrics` retorna as métricas `cache_aside_permission_*`
- [x] Prometheus sobe com `npm run db:up` e o target `cache-aside-api` fica `up` com a API no ar
- [x] Grafana acessível em http://localhost:3001
- [x] Datasource Prometheus provisionado e default
- [x] Dashboard **Cache Aside — Permissions** aparece sem configuração manual
- [x] Após 1 miss + N hits, hit ratio e painéis refletem `source=cache` vs `source=db`
- [x] README documenta URLs, credenciais e como gerar tráfego

## 7. Consultas de referência (PromQL)

Hit ratio:

```promql
sum(rate(cache_aside_permission_requests_total{source="cache"}[1m]))
/
clamp_min(
  sum(rate(cache_aside_permission_requests_total{source=~"cache|db"}[1m])),
  1e-9
)
```

Hit vs miss:

```promql
sum by (source) (
  rate(cache_aside_permission_requests_total{source=~"cache|db"}[1m])
)
```

p95:

```promql
histogram_quantile(
  0.95,
  sum by (le, source) (
    rate(cache_aside_permission_duration_seconds_bucket{source=~"cache|db"}[1m])
  )
)
```

## 8. Plano (já executado)

1. Instrumentar `src/metrics.js` + integrar em `src/index.js`
2. Adicionar Prometheus/Grafana no `docker-compose.yml`
3. Provisionar datasource + dashboard em `monitoring/`
4. Atualizar README
5. Validar scrape `up` + painéis com tráfego curl
