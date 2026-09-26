const express = require('express');
const { pool } = require('../db');

const router = express.Router();

const STATUS_VALIDOS = ['pendente', 'confirmada', 'cancelada'];

function validarPayload(body, { parcial = false } = {}) {
  const erros = [];

  if (!parcial || body.cliente !== undefined) {
    if (!body.cliente || typeof body.cliente !== 'string' || !body.cliente.trim()) {
      erros.push('cliente é obrigatório e deve ser uma string não vazia');
    }
  }

  if (!parcial || body.data !== undefined) {
    if (!body.data || isNaN(Date.parse(body.data))) {
      erros.push('data é obrigatória e deve ser uma data válida (YYYY-MM-DD)');
    }
  }

  if (body.status !== undefined && !STATUS_VALIDOS.includes(body.status)) {
    erros.push(`status deve ser um de: ${STATUS_VALIDOS.join(', ')}`);
  }

  return erros;
}

router.post('/', async (req, res, next) => {
  try {
    const erros = validarPayload(req.body);
    if (erros.length) return res.status(400).json({ erros });

    const { cliente, data, status = 'pendente' } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO reservas (cliente, data, status) VALUES ($1, $2, $3) RETURNING *`,
      [cliente, data, status]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM reservas ORDER BY id');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM reservas WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Reserva não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existente = await pool.query('SELECT * FROM reservas WHERE id = $1', [req.params.id]);
    if (!existente.rows[0]) return res.status(404).json({ erro: 'Reserva não encontrada' });

    const erros = validarPayload(req.body, { parcial: true });
    if (erros.length) return res.status(400).json({ erros });

    const atual = existente.rows[0];
    const cliente = req.body.cliente ?? atual.cliente;
    const data = req.body.data ?? atual.data;
    const status = req.body.status ?? atual.status;

    const { rows } = await pool.query(
      `UPDATE reservas SET cliente = $1, data = $2, status = $3 WHERE id = $4 RETURNING *`,
      [cliente, data, status, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM reservas WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ erro: 'Reserva não encontrada' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
