const express = require('express');
const router = express.Router();
const db = require('../models');
const Servicio = db.Servicio;
const SeguroMedico = db.SeguroMedico;
const CoberturaSeguro = db.CoberturaSeguro;

// GET /api/servicios/coberturas
router.get('/coberturas', async (req, res) => {
  try {
    const servicios = await Servicio.findAll({
      include: [
        {
          model: CoberturaSeguro,
          as: 'coberturas',
          include: [
            {
              model: SeguroMedico,
              as: 'seguro'
            }
          ]
        }
      ]
    });

    const result = servicios.map(servicio => ({
      id_servicio: servicio.id || servicio.id_servicio,
      nombre_servicio: servicio.nombre_servicio,
      coberturas: servicio.coberturas.map(c => ({
        id_seguro: c.id_seguro,
        nombre_seguro: c.seguro?.nombre,
        porcentaje_cobertura: c.porcentaje_cobertura
      }))
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;