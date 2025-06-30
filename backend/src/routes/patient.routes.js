const controller = require('../controllers/patient.controller');
const { authJwt } = require('../middleware');
const express = require('express');
const router = express.Router();

// Middleware para verificación de token en todas las rutas
router.use(authJwt.verifyToken);

// --- RUTAS MODIFICADAS ---

// Ruta para obtener todos los pacientes (con paginación y búsqueda)
router.get('/', controller.findAll);

// Ruta para crear un nuevo paciente
router.post('/', controller.create);

// Rutas para un paciente específico por ID
router.get('/:id', controller.findById);
router.put('/:id', controller.update);
router.delete('/:id', authJwt.isAdmin, controller.delete); // Solo admin puede borrar

// La ruta de búsqueda específica ya no es necesaria, la absorbió GET /

// --- FIN DE MODIFICACIONES ---

module.exports = router;