const controller = require('../controllers/specialty.controller');
const { authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();

// Middleware para verificación de token en todas las rutas
router.use(authJwt.verifyToken);

// Rutas para especialidades
router.post('/', authJwt.isAdmin, controller.createSpecialty);
router.get('/', controller.getAllSpecialties);
router.get('/:id', controller.getSpecialtyById);
router.put('/:id', authJwt.isAdmin, controller.updateSpecialty);
router.delete('/:id', authJwt.isAdmin, controller.deleteSpecialty);

module.exports = router;
