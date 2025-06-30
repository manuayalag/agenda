const db = require('../models');
const CoberturaSeguro = db.CoberturaSeguro;

// Crear o actualizar cobertura
exports.setCobertura = async (req, res) => {
  const { id_seguro, id_servicio, porcentaje_cobertura } = req.body;
  const [cobertura, created] = await CoberturaSeguro.upsert({
    id_seguro,
    id_servicio,
    porcentaje_cobertura
  });
  res.json({ cobertura, created });
};

// Obtener cobertura de un seguro para un servicio
exports.getCobertura = async (req, res) => {
  const { id_seguro, id_servicio } = req.params;
  const cobertura = await CoberturaSeguro.findOne({ where: { id_seguro, id_servicio } });
  if (!cobertura) return res.status(404).json({ error: 'No encontrado' });
  res.json(cobertura);
};