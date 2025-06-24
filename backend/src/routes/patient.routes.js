const controller = require('../controllers/patient.controller');
const { authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();

// Middleware para verificación de token en todas las rutas
router.use(authJwt.verifyToken);

// Rutas para pacientes
router.post('/', controller.createPatient);
router.get('/', controller.getAllPatients);
router.get('/search', controller.searchPatients);
router.get('/:id', controller.getPatientById);
router.put('/:id', controller.updatePatient);
router.delete('/:id', authJwt.isAdmin, controller.deletePatient);

module.exports = router;
