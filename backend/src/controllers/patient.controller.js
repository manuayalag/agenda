const db = require('../models');
const Patient = db.Patient;

// Crear un paciente
exports.createPatient = async (req, res) => {
  try {
    // Verificar si ya existe un paciente con ese número de documento
    const existingPatient = await Patient.findOne({
      where: { documentId: req.body.documentId }
    });
    
    if (existingPatient) {
      return res.status(400).json({
        message: 'Ya existe un paciente con ese número de documento'
      });
    }
    
    const patient = await Patient.create({
      fullName: req.body.fullName,
      documentId: req.body.documentId,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      address: req.body.address,
      phone: req.body.phone,
      email: req.body.email,
      insurance: req.body.insurance,
      insuranceNumber: req.body.insuranceNumber,
      allergies: req.body.allergies,
      medicalHistory: req.body.medicalHistory
    });
    
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

// Obtener todos los pacientes
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.findAll();
    
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Buscar pacientes
exports.searchPatients = async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({
        message: 'Se requiere un término de búsqueda'
      });
    }
    
    const patients = await Patient.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          {
            fullName: {
              [db.Sequelize.Op.iLike]: `%${term}%`
            }
          },
          {
            documentId: {
              [db.Sequelize.Op.iLike]: `%${term}%`
            }
          }
        ]
      }
    });
    
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener paciente por ID
exports.getPatientById = async (req, res) => {
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

// Actualizar paciente
exports.updatePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findByPk(patientId);
    
    if (!patient) {
      return res.status(404).json({
        message: 'Paciente no encontrado'
      });
    }
    
    // Si se está cambiando el número de documento, verificar que no exista otro con ese número
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
    
    const patientData = {
      fullName: req.body.fullName || patient.fullName,
      documentId: req.body.documentId || patient.documentId,
      dateOfBirth: req.body.dateOfBirth || patient.dateOfBirth,
      gender: req.body.gender || patient.gender,
      address: req.body.address || patient.address,
      phone: req.body.phone || patient.phone,
      email: req.body.email || patient.email,
      insurance: req.body.insurance || patient.insurance,
      insuranceNumber: req.body.insuranceNumber || patient.insuranceNumber,
      allergies: req.body.allergies || patient.allergies,
      medicalHistory: req.body.medicalHistory || patient.medicalHistory,
      active: req.body.active !== undefined ? req.body.active : patient.active
    };
    
    await patient.update(patientData);
    
    res.status(200).json({
      message: 'Paciente actualizado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Eliminar paciente
exports.deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const patient = await Patient.findByPk(patientId);
    
    if (!patient) {
      return res.status(404).json({
        message: 'Paciente no encontrado'
      });
    }
    
    // Verificar si tiene citas
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
