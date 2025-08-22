const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const authMiddleware = require('../middlewares/authMiddleware'); 

// token
router.use(authMiddleware);

// perfil
router.get('/perfil', usuariosController.profile);

// favoritos
router.get('/favoritos', usuariosController.getFavorites);
router.post('/favoritos', usuariosController.toggleFavorite);

// atualizar e excluir
router.patch('/:id', usuariosController.patchById);
router.delete('/:id', usuariosController.deleteById);

module.exports = router;