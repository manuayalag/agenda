const express = require('express');
const router = express.Router();
const seguroCtrl = require('../controllers/seguro.controller');
const coberturaCtrl = require('../controllers/cobertura.controller');

// Seguros médicos
router.post('/', seguroCtrl.createSeguro);
router.get('/', seguroCtrl.getAllSeguros);
router.get('/:id', seguroCtrl.getSeguroById);
router.put('/:id', seguroCtrl.updateSeguro);
router.delete('/:id', seguroCtrl.deleteSeguro);

// Coberturas
router.post('/cobertura', coberturaCtrl.setCobertura);
router.get('/cobertura/:id_seguro/:id_servicio', coberturaCtrl.getCobertura);

module.exports = router;