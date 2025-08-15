const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const authMiddleware = require('../middlewares/authMiddleware'); 

router.use(authMiddleware); 

router.get('/perfil', usuariosController.login);

module.exports = router;