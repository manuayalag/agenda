const db = require('../models');
const Servicio = db.Servicio;
const { Op } = db.Sequelize;

// Funciones de ayuda para paginación
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, items, totalPages, currentPage };
};

// Crear un nuevo servicio
exports.create = async (req, res) => {
  try {
    const servicio = await Servicio.create(req.body);
    res.status(201).json(servicio);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Obtener todos los servicios con paginación y búsqueda
exports.findAll = async (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);

  // Condición de búsqueda (si 'search' tiene contenido)
  const condition = search ? { nombre_servicio: { [Op.iLike]: `%${search}%` } } : null;

  try {
    const data = await Servicio.findAndCountAll({
      where: condition,
      limit,
      offset,
      order: [['id', 'ASC']] // Ordenar por ID para consistencia numérica
    });

    const response = getPagingData(data, page, limit);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar un servicio por su ID
exports.update = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    await servicio.update(req.body);
    res.json(servicio);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Eliminar un servicio por su ID
exports.remove = async (req, res) => {
  try {
    const deleted = await Servicio.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.json({ success: true, message: 'Servicio eliminado correctamente.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};