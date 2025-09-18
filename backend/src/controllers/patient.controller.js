const db = require('../models');
const Patient = db.Patient;
const { Op } = db.Sequelize;

// --- INICIO DE LA SECCIÓN MODIFICADA ---

// Funciones de ayuda para la paginación
const getPagination = (page, size) => {
  const limit = size ? +size : 10; // 10 pacientes por página por defecto
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, items, totalPages, currentPage };
};

// Reemplaza getAllPatients y searchPatients con esta única función
exports.findAll = (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);

  // La condición busca en 'fullName' O en 'documentId'
  // Si no hay término de búsqueda, la condición es nula y trae todos los pacientes.
  const where = {}; 
  if (search) {
    where[Op.or] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { documentId: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Se usa el objeto 'where' que estará vacío si no hay búsqueda
  Patient.findAndCountAll({ where: where, limit, offset, order: [['fullName', 'ASC']] })
    .then(data => {
      const response = getPagingData(data, page, limit);
      res.status(200).send(response);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Ocurrió un error al recuperar los pacientes."
      });
    });
};

// --- FIN DE LA SECCIÓN MODIFICADA ---

// Crear un paciente (sin cambios)
exports.create = async (req, res) => {
  try {
    const existingPatient = await Patient.findOne({
      where: { documentId: req.body.documentId }
    });
    
    if (existingPatient) {
      return res.status(400).json({
        message: 'Ya existe un paciente con ese número de documento'
      });
    }
    
    const patient = await Patient.create(req.body);
    
    res.status(201).json({
      message: 'Paciente creado exitosamente',
      patient: patient
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener paciente por ID (sin cambios)
exports.findById = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        message: 'Paciente no encontrado'
      });
    }
    
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Actualizar paciente (sin cambios)
exports.update = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findByPk(patientId);
    
    if (!patient) {
      return res.status(404).json({
        message: 'Paciente no encontrado'
      });
    }
    
    if (req.body.documentId && req.body.documentId !== patient.documentId) {
      const existingPatient = await Patient.findOne({
        where: { documentId: req.body.documentId }
      });
      
      if (existingPatient) {
        return res.status(400).json({
          message: 'Ya existe un paciente con ese número de documento'
        });
      }
    }
    
    await patient.update(req.body);
    
    res.status(200).json({
      message: 'Paciente actualizado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Eliminar paciente (sin cambios)
exports.delete = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findByPk(patientId);
    
    if (!patient) {
      return res.status(404).json({
        message: 'Paciente no encontrado'
      });
    }
    
    const appointments = await db.Appointment.findOne({
      where: { patientId: patientId }
    });
    
    if (appointments) {
      return res.status(400).json({
        message: 'No se puede eliminar el paciente porque tiene citas asociadas'
      });
    }
    
    await patient.destroy();
    
    res.status(200).json({
      message: 'Paciente eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};