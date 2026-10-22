const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const permissionRequestsTotal = new client.Counter({
  name: "cache_aside_permission_requests_total",
  help: "Total de requests em GET /permission por origem da resposta",
  labelNames: ["source"],
  registers: [register],
});

const permissionDurationSeconds = new client.Histogram({
  name: "cache_aside_permission_duration_seconds",
  help: "Duração das requests em GET /permission",
  labelNames: ["source"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2],
  registers: [register],
});

function observarPermission(source, segundos) {
  permissionRequestsTotal.inc({ source });
  permissionDurationSeconds.observe({ source }, segundos);
}

module.exports = {
  register,
  observarPermission,
};
