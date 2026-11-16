const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const asyncHandler = require('../middlewares/asyncHandler');
const rateLimit = require('../middlewares/rateLimit');

router.post('/login', rateLimit({ max: 10 }), asyncHandler(auth.login));
router.post('/register', rateLimit({ max: 5 }), asyncHandler(auth.register));
router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.status(204).send();
});

module.exports = router;
