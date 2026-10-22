const express = require("express");
const { buscarPedidosPorClienteEStatus } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/pedidos", async (req, res) => {
  const clienteId = Number(req.query.clienteId);
  const status = req.query.status || "pendente";

  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    return res.status(400).json({
      erro: "Parâmetro clienteId é obrigatório e deve ser um inteiro positivo.",
    });
  }

  try {
    console.time(`db:cliente=${clienteId}:status=${status}`);
    const pedidos = await buscarPedidosPorClienteEStatus(clienteId, status);
    console.timeEnd(`db:cliente=${clienteId}:status=${status}`);

    return res.json({
      clienteId,
      status,
      total: pedidos.length,
      pedidos,
    });
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error.message);
    return res.status(500).json({ erro: "Erro ao buscar pedidos no banco." });
  }
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  console.log(
    `Exemplo: GET http://localhost:${PORT}/pedidos?clienteId=1&status=pendente`
  );
});
