const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
require('dotenv').config(); 

const app = express();


app.use(cors({
  origin: process.env.FRONTEND_URL || '*', 
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🛡️ Servidor de autenticação rodando na porta ${PORT}`);
});