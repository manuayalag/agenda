const db = require('../models');
const Sector = db.Sector;
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

// OBTENER TODOS LOS SECTORES (CON BÚSQUEDA Y PAGINACIÓN)
exports.getAllSectors = async (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);

  const condition = search ? { name: { [Op.iLike]: `%${search}%` } } : null;

  try {
    const data = await Sector.findAndCountAll({
      where: condition,
      limit,
      offset,
      include: [{ model: db.User, as: 'admin', attributes: ['id', 'fullName'] }],
      order: [['name', 'ASC']]
    });
    const response = getPagingData(data, page, limit);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- El resto de las funciones permanecen sin cambios ---

// Crear un sector
exports.createSector = async (req, res) => {
  try {
    const sector = await Sector.create({
      name: req.body.name,
      description: req.body.description,
      adminId: req.body.adminId,
      active: req.body.active
    });
    res.status(201).json({ message: 'Sector creado exitosamente', sector: sector });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener sector por ID
exports.getSectorById = async (req, res) => {
  try {
    const sector = await Sector.findByPk(req.params.id, {
      include: [
        { model: db.User, as: 'admin', attributes: ['id', 'username', 'email', 'fullName'] },
        { model: db.Prestador, as: 'prestadores' }
      ]
    });
    if (!sector) {
      return res.status(404).json({ message: 'Sector no encontrado' });
    }
    res.status(200).json(sector);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar sector
exports.updateSector = async (req, res) => {
  try {
    const sectorId = req.params.id;
    const sector = await Sector.findByPk(sectorId);
    
    if (!sector) {
      return res.status(404).json({
        message: 'Sector no encontrado'
      });
    }
    
    await sector.update(req.body);
    
    res.status(200).json({
      message: 'Sector actualizado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Eliminar sector
exports.deleteSector = async (req, res) => {
  try {
    const sectorId = req.params.id;
    const sector = await Sector.findByPk(sectorId);
    
    if (!sector) {
      return res.status(404).json({
        message: 'Sector no encontrado'
      });
    }
    
    const doctors = await db.Prestador.findOne({
      where: { sectorId: sectorId }
    });
    
    if (doctors) {
      return res.status(400).json({
        message: 'No se puede eliminar el sector porque tiene doctores asociados'
      });
    }
    
    await sector.destroy();
    
    res.status(200).json({
      message: 'Sector eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};