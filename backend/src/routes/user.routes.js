const controller = require('../controllers/user.controller');
const { authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();

// Middleware para verificación de token en todas las rutas
router.use(authJwt.verifyToken);

// Rutas para usuarios
router.post('/', authJwt.isAdmin, controller.create);
router.get('/', authJwt.isAdmin, controller.getAllUsers);
router.get('/:id', controller.getUserById);
router.put('/:id', controller.updateUser);
router.delete('/:id', authJwt.isAdmin, controller.deleteUser);

module.exports = router;
