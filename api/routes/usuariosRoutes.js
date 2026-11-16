const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const authMiddleware = require('../middlewares/authMiddleware'); 
const asyncHandler = require('../middlewares/asyncHandler');

// token
router.use(authMiddleware);

// perfil
router.get('/perfil', asyncHandler(usuariosController.profile));

// favoritos
router.get('/favoritos', asyncHandler(usuariosController.getFavorites));
router.post('/favoritos', asyncHandler(usuariosController.toggleFavorite));

// atualizar e excluir
router.patch('/:id', asyncHandler(usuariosController.patchById));
router.delete('/:id', asyncHandler(usuariosController.deleteById));

module.exports = router;
