const controller = require('../controllers/doctor.controller');
const { authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();

// Middleware para verificación de token en todas las rutas
router.use(authJwt.verifyToken);

// Rutas para prestadores (antes doctores)
router.get('/', controller.getAllPrestadores);
router.get('/sector/:sectorId', controller.getPrestadoresBySector);
router.get('/:id', controller.getPrestadorById);
router.put('/:id', authJwt.isAdmin, controller.updatePrestador);
router.get('/:id/availability', controller.getPrestadorAvailability);
router.get('/:id/schedules', controller.getPrestadorHorarios);
router.post('/:id/schedules', controller.addPrestadorHorario);
router.delete('/:id/schedules/:scheduleId', controller.deletePrestadorHorario);

module.exports = router;
