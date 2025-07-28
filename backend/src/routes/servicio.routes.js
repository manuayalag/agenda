const express = require('express');
const router = express.Router();
// La ruta debe ser relativa al archivo actual.
// Desde /src/routes/ para llegar a /src/controllers/ es ../controllers/
const servicioCtrl = require('../controllers/servicio.controller');

// Definir las rutas para el CRUD de Servicios
router.get('/', servicioCtrl.findAll);
router.post('/', servicioCtrl.create);
router.put('/:id', servicioCtrl.update);
router.delete('/:id', servicioCtrl.remove);

module.exports = router;