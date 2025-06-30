const controller = require('../controllers/doctor.controller');
const { authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();

// Middleware para verificación de token en todas las rutas
router.use(authJwt.verifyToken);

// Rutas para prestadores (doctores)
router.post('/', authJwt.isAdmin, controller.createPrestador);
router.get('/', controller.getAllPrestadores);
router.get('/sector/:sectorId', controller.getPrestadoresBySector);
router.get('/:id', controller.getPrestadorById);
router.put('/:id', authJwt.isAdmin, controller.updatePrestador);

// --- RUTAS DE DISPONIBILIDAD (MODIFICADAS Y AÑADIDAS) ---
router.get('/:id/monthly-availability', controller.getMonthlyAvailability); // Nueva ruta
router.get('/:id/availability/:date', controller.getDailyAvailability); // Ruta modificada

// --- RUTAS DE HORARIOS (SIN CAMBIOS) ---
router.get('/:id/schedules', controller.getPrestadorHorarios);
router.post('/:id/schedules', controller.addPrestadorHorario);
router.delete('/:id/schedules/:scheduleId', controller.deletePrestadorHorario);

module.exports = router;