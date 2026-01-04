const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const receitasRoutes = require('./routes/receitasRoutes');
const { query } = require('./services/db');
require('dotenv').config();

const app = express();
const publicDir = path.join(__dirname, '../public');

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(express.json());
app.use(express.static(publicDir));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// categorias
app.get('/api/categorias', async (req, res) => {
  try {
    const result = await query('SELECT id_categoria, nome FROM categorias ORDER BY nome');
    res.json(result.rows.map(row => ({ id: row.id_categoria, nome: row.nome })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao carregar categorias' });
  }
});

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
