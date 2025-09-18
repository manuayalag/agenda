const controller = require('../controllers/doctor.controller');
const prestadorServicioController = require("../controllers/prestadorServicio.controller"); 
const { authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authJwt.verifyToken);

// --- RUTAS DEL PERFIL DEL PRESTADOR ---
router.post('/', authJwt.isAdmin, controller.createPrestador);
router.get('/', controller.getAllPrestadores);
router.get('/sector/:sectorId', controller.getPrestadoresBySector);
router.get('/:id', controller.getPrestadorById);
router.put('/:id', authJwt.isAdmin, controller.updatePrestador);

// --- RUTAS DE DISPONIBILIDAD Y HORARIOS ---
router.get('/:id/monthly-availability', controller.getMonthlyAvailability);
router.get('/:id/availability/:date', controller.getDailyAvailability);
router.get('/:id/schedules', controller.getPrestadorHorarios);
router.post('/:id/schedules', controller.addPrestadorHorario);
router.delete('/:id/schedules/:scheduleId', controller.deletePrestadorHorario);
router.get('/:id/monthly-schedule', controller.getMonthlySchedule);

// --- NUEVAS RUTAS PARA AUSENCIAS ---
router.post('/:id/absences', controller.addAusencia);
router.get('/:id/absences', controller.getAusencias);
router.delete('/absences/:absenceId', controller.deleteAusencia);

// Obtener los servicios asignados
router.get(
    "/:id_prestador/servicios",
    prestadorServicioController.getServiciosByPrestador
);

// Asignar servicios a un prestador
router.post(
    "/:id_prestador/servicios",
    prestadorServicioController.addServiciosToPrestador
);

// Quitar un servicio de un prestador
router.delete(
    "/:id_prestador/servicios/:id_servicio",
    prestadorServicioController.removeServicioFromPrestador
);

module.exports = router;