const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1. Extrai o token do cabeçalho (formato: "Bearer <token>")
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; 

  // 2. Verifica se o token existe
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  // 3. Valida o token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Injeta o ID do usuário na requisição
    next(); // Passa para o próximo middleware/controller
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};