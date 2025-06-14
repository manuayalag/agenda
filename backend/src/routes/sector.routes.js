const controller = require('../controllers/sector.controller');
const { authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();

// Middleware para verificación de token en todas las rutas
router.use((req, res, next) => {
  authJwt.verifyToken(req, res, next);
});

// Rutas para sectores
router.post('/', controller.createSector); // Permitimos que cualquier usuario autenticado cree sectores (por ahora)
router.get('/', controller.getAllSectors);
router.get('/:id', controller.getSectorById);
router.put('/:id', controller.updateSector); // Permitimos que cualquier usuario autenticado actualice sectores
router.delete('/:id', authJwt.isAdmin, controller.deleteSector); // Solo administradores pueden eliminar

module.exports = router;
