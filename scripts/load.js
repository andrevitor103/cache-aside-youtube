#!/usr/bin/env node

/**
 * Simula carga em GET /permission para a demo (Grafana / cache-aside).
 *
 * Exemplos:
 *   npm run load
 *   npm run load -- --total 50 --user 1
 *   npm run load -- --total 100 --concurrency 10 --users 1,2,3
 *   npm run load -- --total 30 --delay 100
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function parseArgs(argv) {
  const args = {
    total: 40,
    concurrency: 5,
    delay: 0,
    users: [1],
  };

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];

    if (flag === "--total" && value) {
      args.total = Number(value);
      i++;
    } else if (flag === "--concurrency" && value) {
      args.concurrency = Number(value);
      i++;
    } else if (flag === "--delay" && value) {
      args.delay = Number(value);
      i++;
    } else if (flag === "--user" && value) {
      args.users = [Number(value)];
      i++;
    } else if (flag === "--users" && value) {
      args.users = value.split(",").map((u) => Number(u.trim()));
      i++;
    } else if (flag === "--help" || flag === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (!Number.isInteger(args.total) || args.total <= 0) {
    throw new Error("--total deve ser um inteiro positivo");
  }
  if (!Number.isInteger(args.concurrency) || args.concurrency <= 0) {
    throw new Error("--concurrency deve ser um inteiro positivo");
  }
  if (!Number.isInteger(args.delay) || args.delay < 0) {
    throw new Error("--delay deve ser um inteiro >= 0 (ms)");
  }
  if (args.users.some((u) => !Number.isInteger(u) || u <= 0)) {
    throw new Error("--user/--users devem ser inteiros positivos");
  }

  return args;
}

function printHelp() {
  console.log(`Uso: node scripts/load.js [opções]

Opções:
  --total N          total de requests (default: 40)
  --concurrency N    requests em paralelo (default: 5)
  --delay MS         pausa entre batches em ms (default: 0)
  --user N           um único user (default: 1)
  --users 1,2,3      rotaciona entre users
  --help             mostra esta ajuda

Env:
  BASE_URL           default http://localhost:3000
`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function chamarPermission(user) {
  const started = performance.now();
  const url = `${BASE_URL}/permission?user=${user}`;

  try {
    const response = await fetch(url);
    const body = await response.json();
    const ms = performance.now() - started;

    return {
      ok: response.ok,
      status: response.status,
      user,
      source: body.source || "unknown",
      ms,
      erro: body.erro,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      user,
      source: "error",
      ms: performance.now() - started,
      erro: error.message,
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const counts = {
    cache: 0,
    db: 0,
    error_cache: 0,
    error_db: 0,
    bad_request: 0,
    unknown: 0,
    error: 0,
  };
  const durations = [];
  let falhas = 0;

  console.log(
    `Carga: total=${args.total} concurrency=${args.concurrency} delay=${args.delay}ms users=${args.users.join(",")} url=${BASE_URL}`
  );

  let enviadas = 0;

  while (enviadas < args.total) {
    const batchSize = Math.min(args.concurrency, args.total - enviadas);
    const batch = [];

    for (let i = 0; i < batchSize; i++) {
      const user = args.users[(enviadas + i) % args.users.length];
      batch.push(chamarPermission(user));
    }

    const resultados = await Promise.all(batch);

    for (const resultado of resultados) {
      enviadas++;
      durations.push(resultado.ms);

      if (!resultado.ok) {
        falhas++;
      }

      const key = counts[resultado.source] !== undefined ? resultado.source : "unknown";
      counts[key]++;

      const icon = resultado.source === "cache" ? "HIT " : resultado.source === "db" ? "MISS" : "ERR ";
      console.log(
        `#${String(enviadas).padStart(3, "0")} ${icon} user=${resultado.user} status=${resultado.status} ${resultado.ms.toFixed(1)}ms` +
          (resultado.erro ? ` erro="${resultado.erro}"` : "")
      );
    }

    if (args.delay > 0 && enviadas < args.total) {
      await sleep(args.delay);
    }
  }

  durations.sort((a, b) => a - b);
  const p95 = durations[Math.max(0, Math.ceil(durations.length * 0.95) - 1)];
  const media = durations.reduce((a, b) => a + b, 0) / durations.length;
  const hits = counts.cache;
  const misses = counts.db;
  const hitRatio = hits + misses === 0 ? 0 : hits / (hits + misses);

  console.log("\n--- resumo ---");
  console.log(`total: ${args.total} | falhas: ${falhas}`);
  console.log(`cache hit: ${hits} | miss(db): ${misses} | hit ratio: ${(hitRatio * 100).toFixed(1)}%`);
  console.log(`latência média: ${media.toFixed(1)}ms | p95: ${p95.toFixed(1)}ms`);
  console.log("por source:", counts);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
