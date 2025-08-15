const express = require('express');
const router = express.Router();
const receitasController = require('../controllers/receitasController');

router.get('/', receitasController.getAll);
router.get('/:id', receitasController.getById);
router.get('/categoria/:categoriaId', receitasController.getByCategory); 
router.post('/', receitasController.create);
router.put('/:id', receitasController.update);
router.delete('/:id', receitasController.delete);

module.exports = router;