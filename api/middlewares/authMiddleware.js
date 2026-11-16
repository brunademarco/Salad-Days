const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 1. Extrai o token do cabeçalho (formato: "Bearer <token>")
  const authHeader = req.headers.authorization;
  const authToken = authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7) !== 'null'
    ? authHeader.slice(7) : '';
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(part => {
    const index = part.indexOf('=');
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }));
  const token = authToken || cookies.token;

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
