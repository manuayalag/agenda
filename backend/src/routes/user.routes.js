const controller = require('../controllers/user.controller');
const { authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();

// Middleware para verificación de token en todas las rutas
router.use((req, res, next) => {
  authJwt.verifyToken(req, res, next);
});

// Rutas para usuarios
router.get('/', authJwt.isAdmin, controller.getAllUsers);
router.get('/:id', controller.getUserById);
router.put('/:id', controller.updateUser);
router.delete('/:id', authJwt.isAdmin, controller.deleteUser);

module.exports = router;
