const controller = require('../controllers/doctor.controller');
const { authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();

// Middleware para verificación de token en todas las rutas
router.use((req, res, next) => {
  authJwt.verifyToken(req, res, next);
});

// Rutas para doctores
router.get('/', controller.getAllDoctors);
router.get('/sector/:sectorId', controller.getDoctorsBySector);
router.get('/:id', controller.getDoctorById);
router.put('/:id', authJwt.isAdmin, controller.updateDoctor);
router.get('/:id/availability', controller.getDoctorAvailability);

module.exports = router;
