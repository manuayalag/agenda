const db = require('../models');
const Specialty = db.Specialty;
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

// OBTENER TODAS LAS ESPECIALIDADES (CON BÚSQUEDA Y PAGINACIÓN)
exports.getAllSpecialties = async (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);

  const condition = search ? { name: { [Op.iLike]: `%${search}%` } } : null;

  try {
    const data = await Specialty.findAndCountAll({
      where: condition,
      limit,
      offset,
      order: [['name', 'ASC']]
    });
    const response = getPagingData(data, page, limit);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- El resto de las funciones permanecen sin cambios ---

// Crear una especialidad
exports.createSpecialty = async (req, res) => {
  try {
    const specialty = await Specialty.create({
      name: req.body.name,
      description: req.body.description,
      active: req.body.active
    });
    res.status(201).json({ message: 'Especialidad creada exitosamente', specialty: specialty });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener especialidad por ID
exports.getSpecialtyById = async (req, res) => {
  try {
    const specialty = await Specialty.findByPk(req.params.id);
    if (!specialty) {
      return res.status(404).json({ message: 'Especialidad no encontrada' });
    }
    res.status(200).json(specialty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar especialidad
exports.updateSpecialty = async (req, res) => {
  try {
    const specialtyId = req.params.id;
    const specialty = await Specialty.findByPk(specialtyId);
    
    if (!specialty) {
      return res.status(404).json({
        message: 'Especialidad no encontrada'
      });
    }
    
    const specialtyData = {
      name: req.body.name || specialty.name,
      description: req.body.description || specialty.description,
      active: req.body.active !== undefined ? req.body.active : specialty.active
    };
    
    await specialty.update(specialtyData);
    
    res.status(200).json({
      message: 'Especialidad actualizada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Eliminar especialidad
exports.deleteSpecialty = async (req, res) => {
  try {
    const specialtyId = req.params.id;
    const specialty = await Specialty.findByPk(specialtyId);
    
    if (!specialty) {
      return res.status(404).json({
        message: 'Especialidad no encontrada'
      });
    }
    
    // Verificar si tiene doctores asociados
    const doctors = await db.Prestador.findOne({
      where: { specialtyId: specialtyId }
    });
    
    if (doctors) {
      return res.status(400).json({
        message: 'No se puede eliminar la especialidad porque tiene doctores asociados'
      });
    }
    
    await specialty.destroy();
    
    res.status(200).json({
      message: 'Especialidad eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};