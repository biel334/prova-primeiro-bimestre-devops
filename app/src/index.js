const express = require('express');
const { pool, initSchema } = require('./db');
const reservasRouter = require('./routes/reservas');

const app = express();
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/reservas', reservasRouter);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;

async function start() {
  await initSchema();
  app.listen(PORT, () => console.log(`API de Reservas rodando na porta ${PORT}`));
}

start().catch((err) => {
  console.error('Falha ao iniciar aplicação:', err);
  process.exit(1);
});
