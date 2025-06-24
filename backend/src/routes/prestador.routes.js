const express = require('express');
const router = express.Router();
const db = require('../models');
const Prestador = db.Prestador;
const Servicio = db.Servicio;
const PrestadorServicio = db.PrestadorServicio;

// Obtener servicios de un prestador
router.get('/:id/servicios', async (req, res) => {
  try {
    const prestador = await Prestador.findByPk(req.params.id, {
      include: [{ model: Servicio, as: 'servicios' }]
    });
    if (!prestador) return res.status(404).json({ error: 'Prestador no encontrado' });
    // Normalizar los servicios para que siempre tengan un campo 'id'
    const servicios = prestador.servicios.map(s => ({
      id: s.id || s.id_servicio,
      nombre_servicio: s.nombre_servicio,
      tiempo: s.tiempo,
      precio: s.precio
    }));
    res.json(servicios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Asignar servicios a un prestador
router.post('/:id/servicios', async (req, res) => {
  try {
    const { servicios } = req.body; // array de ids de servicios
    const prestador = await Prestador.findByPk(req.params.id);
    if (!prestador) return res.status(404).json({ error: 'Prestador no encontrado' });
    await prestador.setServicios(servicios); // setServicios es de Sequelize
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
