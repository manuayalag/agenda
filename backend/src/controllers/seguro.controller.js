const db = require('../models');
const SeguroMedico = db.SeguroMedico;

// Crear seguro
exports.createSeguro = async (req, res) => {
  try {
    const seguro = await SeguroMedico.create({ nombre: req.body.nombre });
    res.status(201).json(seguro);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Listar todos los seguros
exports.getAllSeguros = async (req, res) => {
  const seguros = await SeguroMedico.findAll();
  res.json(seguros);
};

// Obtener seguro por id
exports.getSeguroById = async (req, res) => {
  const seguro = await SeguroMedico.findByPk(req.params.id);
  if (!seguro) return res.status(404).json({ error: 'No encontrado' });
  res.json(seguro);
};

// Actualizar seguro
exports.updateSeguro = async (req, res) => {
  const seguro = await SeguroMedico.findByPk(req.params.id);
  if (!seguro) return res.status(404).json({ error: 'No encontrado' });
  seguro.nombre = req.body.nombre;
  await seguro.save();
  res.json(seguro);
};

// Eliminar seguro
exports.deleteSeguro = async (req, res) => {
  const seguro = await SeguroMedico.findByPk(req.params.id);
  if (!seguro) return res.status(404).json({ error: 'No encontrado' });
  await seguro.destroy();
  res.json({ message: 'Eliminado' });
};