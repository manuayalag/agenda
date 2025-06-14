const db = require('../models');
const Specialty = db.Specialty;

// Crear una especialidad
exports.createSpecialty = async (req, res) => {
  try {
    const specialty = await Specialty.create({
      name: req.body.name,
      description: req.body.description
    });
    
    res.status(201).json({
      message: 'Especialidad creada exitosamente',
      specialty: specialty
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener todas las especialidades
exports.getAllSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.findAll({
      order: [['name', 'ASC']]
    });
    
    res.status(200).json(specialties);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener especialidad por ID
exports.getSpecialtyById = async (req, res) => {
  try {
    const specialty = await Specialty.findByPk(req.params.id);
    
    if (!specialty) {
      return res.status(404).json({
        message: 'Especialidad no encontrada'
      });
    }
    
    res.status(200).json(specialty);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
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
    const doctors = await db.Doctor.findOne({
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
