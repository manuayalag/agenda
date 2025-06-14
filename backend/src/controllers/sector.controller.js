const db = require('../models');
const Sector = db.Sector;

// Crear un sector
exports.createSector = async (req, res) => {
  try {
    const sector = await Sector.create({
      name: req.body.name,
      description: req.body.description,
      adminId: req.body.adminId
    });
    
    res.status(201).json({
      message: 'Sector creado exitosamente',
      sector: sector
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener todos los sectores
exports.getAllSectors = async (req, res) => {
  try {
    const sectors = await Sector.findAll({
      include: [
        { 
          model: db.User, 
          as: 'admin',
          attributes: ['id', 'username', 'email', 'fullName'] 
        }
      ]
    });
    
    res.status(200).json(sectors);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener sector por ID
exports.getSectorById = async (req, res) => {
  try {
    const sector = await Sector.findByPk(req.params.id, {
      include: [
        { 
          model: db.User, 
          as: 'admin',
          attributes: ['id', 'username', 'email', 'fullName'] 
        },
        {
          model: db.Doctor,
          as: 'doctors',
          include: [
            { model: db.User, as: 'user', attributes: ['fullName'] },
            { model: db.Specialty, as: 'specialty' }
          ]
        }
      ]
    });
    
    if (!sector) {
      return res.status(404).json({
        message: 'Sector no encontrado'
      });
    }
    
    res.status(200).json(sector);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
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
    
    const sectorData = {
      name: req.body.name || sector.name,
      description: req.body.description || sector.description,
      adminId: req.body.adminId !== undefined ? req.body.adminId : sector.adminId,
      active: req.body.active !== undefined ? req.body.active : sector.active
    };
    
    await sector.update(sectorData);
    
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
    
    // Verificar si tiene doctores asociados
    const doctors = await db.Doctor.findOne({
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
