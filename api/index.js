const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const receitasRoutes = require('./routes/receitasRoutes');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/receitas', usuariosRoutes);

app.get('/', (req, res) => {
  res.redirect('/api/health'); 

});

app.get('/', (req, res) => res.redirect('/api/health'));
app.get('/api/health', (req, res) => res.json({ status: 'API funcionando' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🛡️ Servidor rodando na porta ${PORT}`));
}

module.exports = app; 