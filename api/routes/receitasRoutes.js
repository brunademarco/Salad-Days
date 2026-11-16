const express = require('express');
const router = express.Router();
const receitas = require('../controllers/receitasController');
const auth = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

// public
router.get('/', asyncHandler(receitas.getAll));
router.get('/categoria/:categoriaId', asyncHandler(receitas.getByCategory));
router.get('/:id', asyncHandler(receitas.getById));

// autenticadas
router.post('/', auth, asyncHandler(receitas.create));
router.put('/:id', auth, asyncHandler(receitas.update));
router.delete('/:id', auth, asyncHandler(receitas.delete));

module.exports = router;
