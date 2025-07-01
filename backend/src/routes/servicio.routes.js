const express = require('express');
const router = express.Router();
const db = require('../models');
const Servicio = db.Servicio;

// GET /api/servicios
router.get('/', async (req, res) => {
  try {
    const servicios = await Servicio.findAll();
    res.json(servicios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
