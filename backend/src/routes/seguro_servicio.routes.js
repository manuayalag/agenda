const express = require('express');
const router = express.Router();
const db = require('../models');
const CoberturaSeguro = db.CoberturaSeguro;
const Servicio = db.Servicio;
const SeguroMedico = db.SeguroMedico;

// GET: Listar servicios cubiertos por un seguro
router.get('/:id_seguro/servicios', async (req, res) => {
  try {
    const coberturas = await CoberturaSeguro.findAll({
      where: { id_seguro: req.params.id_seguro },
      include: [
        { model: Servicio, as: 'servicio' }
      ]
    });
    res.json(
      coberturas.map(c => ({
        id_servicio: c.id_servicio,
        nombre_servicio: c.servicio?.nombre_servicio,
        porcentaje_cobertura: c.porcentaje_cobertura
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Agregar servicio cubierto a un seguro
router.post('/:id_seguro/servicios', async (req, res) => {
  try {
    const { id_servicio, porcentaje_cobertura } = req.body;
    const cobertura = await CoberturaSeguro.create({
      id_seguro: req.params.id_seguro,
      id_servicio,
      porcentaje_cobertura
    });
    res.status(201).json(cobertura);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT: Editar porcentaje de cobertura de un servicio para un seguro
router.put('/:id_seguro/servicios/:id_servicio', async (req, res) => {
  try {
    const { porcentaje_cobertura } = req.body;
    const cobertura = await CoberturaSeguro.findOne({
      where: {
        id_seguro: req.params.id_seguro,
        id_servicio: req.params.id_servicio
      }
    });
    if (!cobertura) return res.status(404).json({ error: 'Cobertura no encontrada' });
    cobertura.porcentaje_cobertura = porcentaje_cobertura;
    await cobertura.save();
    res.json(cobertura);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE: Quitar un servicio de un seguro
router.delete('/:id_seguro/servicios/:id_servicio', async (req, res) => {
  try {
    const deleted = await CoberturaSeguro.destroy({
      where: {
        id_seguro: req.params.id_seguro,
        id_servicio: req.params.id_servicio
      }
    });
    if (!deleted) return res.status(404).json({ error: 'Cobertura no encontrada' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;