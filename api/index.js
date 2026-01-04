const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const receitasRoutes = require('./routes/receitasRoutes');
const { readDB } = require('./services/dbService');
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
app.get('/api/categorias', (req, res) => {
  try {
    const db = readDB();
    res.json(db.categorias || []);
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
