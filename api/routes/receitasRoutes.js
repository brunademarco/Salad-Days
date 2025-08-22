const express = require('express');
const router = express.Router();
const receitas = require('../controllers/receitasController');
const auth = require('../middlewares/authMiddleware');

// public
router.get('/', receitas.getAll);                       
router.get('/categoria/:categoriaId', receitas.getByCategory);
router.get('/:id', receitas.getById);

// autenticadas
router.post('/', auth, receitas.create);
router.put('/:id', auth, receitas.update);               
router.delete('/:id', auth, receitas.delete);            

module.exports = router;