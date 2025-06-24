const express = require('express');
const router = express.Router();
const db = require('../models');
const Servicio = db.Servicio;

// Obtener todos los servicios
router.get('/', async (req, res) => {
  try {
    const servicios = await Servicio.findAll();
    res.json(servicios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un servicio por ID
router.get('/:id', async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) return res.status(404).json({ error: 'No encontrado' });
    res.json(servicio);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
