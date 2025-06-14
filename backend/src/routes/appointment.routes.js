const controller = require('../controllers/appointment.controller');
const { authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();

// Middleware para verificación de token en todas las rutas
router.use((req, res, next) => {
  authJwt.verifyToken(req, res, next);
});

// Rutas para citas
router.post('/', controller.createAppointment);
router.get('/', controller.getAllAppointments);
router.get('/filtered', controller.getFilteredAppointments);
router.get('/doctor/:doctorId', controller.getDoctorAppointments);
router.get('/:id', controller.getAppointmentById);
router.put('/:id', controller.updateAppointment);
router.delete('/:id', authJwt.isAdmin, controller.deleteAppointment);

module.exports = router;
