const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const receitasRoutes = require('./routes/receitasRoutes');
const asyncHandler = require('./middlewares/asyncHandler');
const { query } = require('./services/db');
require('dotenv').config();

const app = express();
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não configurado');
const publicDir = path.join(__dirname, '../public');

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100kb' }));
app.use(express.static(publicDir));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// categorias
app.get('/api/categorias', asyncHandler(async (req, res) => {
  try {
    const result = await query('SELECT id_categoria, nome FROM categorias ORDER BY nome');
    res.json(result.rows.map(row => ({ id: row.id_categoria, nome: row.nome })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao carregar categorias' });
  }
}));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/receitas', receitasRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🛡️ Servidor rodando na porta ${PORT}`));
}

module.exports = app;
