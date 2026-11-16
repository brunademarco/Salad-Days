const attempts = new Map();

module.exports = ({ windowMs = 15 * 60 * 1000, max = 10 } = {}) => (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now - current.startedAt >= windowMs) {
    attempts.set(key, { startedAt: now, count: 1 });
    return next();
  }
  current.count += 1;
  if (current.count > max) return res.status(429).json({ error: 'Muitas tentativas. Tente novamente mais tarde.' });
  next();
};
