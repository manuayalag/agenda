const db = require('../models');
const SeguroMedico = db.SeguroMedico;
const { Op } = db.Sequelize; // Importamos el operador para la búsqueda

// --- FUNCIONES DE AYUDA PARA PAGINACIÓN ---
const getPagination = (page, size) => {
  const limit = size ? +size : 10; // 10 por defecto
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, items, totalPages, currentPage };
};

// --- CONTROLADORES CRUD ---

// Crear seguro
exports.createSeguro = async (req, res) => {
  try {
    const seguro = await SeguroMedico.create({ nombre: req.body.nombre });
    res.status(201).json(seguro);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// --- FUNCIÓN MODIFICADA ---
// Listar todos los seguros con búsqueda y paginación
exports.getAllSeguros = async (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);

  // Condición de búsqueda por nombre (si se proporciona)
  const condition = search ? { nombre: { [Op.iLike]: `%${search}%` } } : null;

  try {
    const data = await SeguroMedico.findAndCountAll({
      where: condition,
      limit,
      offset,
      order: [['nombre', 'ASC']]
    });

    const response = getPagingData(data, page, limit);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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