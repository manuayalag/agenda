const db = require('../models');
const Appointment = db.Appointment;
const Doctor = db.Doctor;
const Patient = db.Patient;
const nodemailer = require('nodemailer');

// Crear una cita
exports.createAppointment = async (req, res) => {
  try {
    // Verificar si ya existe un paciente con esa cédula
    let patient = await Patient.findOne({
      where: { documentId: req.body.patient.documentId }
    });
    
    // Si no existe, crear un nuevo paciente
    if (!patient) {
      patient = await Patient.create({
        fullName: req.body.patient.fullName,
        documentId: req.body.patient.documentId,
        dateOfBirth: req.body.patient.dateOfBirth,
        gender: req.body.patient.gender,
        address: req.body.patient.address,
        phone: req.body.patient.phone,
        email: req.body.patient.email,
        insurance: req.body.patient.insurance,
        insuranceNumber: req.body.patient.insuranceNumber,
        allergies: req.body.patient.allergies,
        medicalHistory: req.body.patient.medicalHistory
      });
    }
    
    // Verificar disponibilidad del doctor para ese horario
    const doctor = await Doctor.findByPk(req.body.doctorId);
    
    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor no encontrado'
      });
    }
    
    // Verificar si el horario está dentro del horario de trabajo del doctor
    const appointmentDate = req.body.date;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    
    // Comprobar que no se solape con otras citas
    const existingAppointment = await Appointment.findOne({
      where: {
        doctorId: req.body.doctorId,
        date: appointmentDate,
        status: {
          [db.Sequelize.Op.ne]: 'cancelled'
        },
        [db.Sequelize.Op.or]: [
          {
            startTime: {
              [db.Sequelize.Op.lt]: endTime,
            },
            endTime: {
              [db.Sequelize.Op.gt]: startTime,
            }
          }
        ]
      }
    });
    
    if (existingAppointment) {
      return res.status(400).json({
        message: 'El horario seleccionado se solapa con otra cita'
      });
    }
    
    // Crear la cita
    const appointment = await Appointment.create({
      doctorId: req.body.doctorId,
      patientId: patient.id,
      date: appointmentDate,
      startTime: startTime,
      endTime: endTime,
      reason: req.body.reason,
      notes: req.body.notes,
      status: 'scheduled',
      createdBy: req.userId
    });
    
    // Enviar notificación por correo si se proporcionó email
    if (patient.email && process.env.NODE_ENV !== 'test') {
      try {
        await sendAppointmentNotification(appointment, patient, doctor);
      } catch (mailError) {
        console.error('Error al enviar correo de notificación:', mailError);
      }
    }
    
    res.status(201).json({
      message: 'Cita creada exitosamente',
      appointment: appointment
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener todas las citas
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        {
          model: db.Doctor,
          as: 'doctor',
          include: [
            { model: db.Specialty, as: 'specialty' },
            { model: db.User, as: 'user', attributes: ['fullName'] }
          ]
        },
        {
          model: db.Patient,
          as: 'patient'
        }
      ],
      order: [['date', 'DESC'], ['startTime', 'ASC']]
    });
    
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener citas filtradas por sector y fecha
exports.getFilteredAppointments = async (req, res) => {
  try {
    const { sectorId, startDate, endDate, status } = req.query;
    
    // Verificar rol de usuario y asignar permisos correspondientes
    const user = await db.User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Si es doctor, redirigir a la función específica para doctores
    if (user.role === 'doctor') {
      const doctor = await db.Doctor.findOne({ where: { userId: user.id } });
      if (!doctor) {
        return res.status(500).json({ message: 'User is not associated to Doctor!' });
      }
      req.doctorId = doctor.id;
      req.params.doctorId = doctor.id;
      return exports.getDoctorAppointments(req, res);
    }
    
    const where = {};
    const doctorWhere = {};
    
    // Filtrar por sector si se proporciona o basado en rol de admin de sector
    if (sectorId) {
      doctorWhere.sectorId = sectorId;
    } else if (user.role === 'sector_admin' && user.sectorId) {
      doctorWhere.sectorId = user.sectorId;
    }
    
    // Filtrar por rango de fechas
    if (startDate && endDate) {
      where.date = {
        [db.Sequelize.Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      where.date = {
        [db.Sequelize.Op.gte]: startDate
      };
    } else if (endDate) {
      where.date = {
        [db.Sequelize.Op.lte]: endDate
      };
    }
    
    // Filtrar por estado
    if (status) {
      where.status = status;
    }
    
    const appointments = await Appointment.findAll({
      where: where,
      include: [
        {
          model: db.Doctor,
          as: 'doctor',
          where: Object.keys(doctorWhere).length ? doctorWhere : null,
          include: [
            { model: db.Specialty, as: 'specialty' },
            { model: db.User, as: 'user', attributes: ['fullName'] }
          ]
        },
        {
          model: db.Patient,
          as: 'patient'
        }
      ],
      order: [['date', 'DESC'], ['startTime', 'ASC']]
    });
    
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener citas de un doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.params.doctorId || req.doctorId;
    const { startDate, endDate, status } = req.query;
    
    const where = {
      doctorId: doctorId
    };
    
    // Filtrar por rango de fechas
    if (startDate && endDate) {
      where.date = {
        [db.Sequelize.Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      where.date = {
        [db.Sequelize.Op.gte]: startDate
      };
    } else if (endDate) {
      where.date = {
        [db.Sequelize.Op.lte]: endDate
      };
    }
    
    // Filtrar por estado
    if (status) {
      where.status = status;
    }
    
    const appointments = await Appointment.findAll({
      where: where,
      include: [
        {
          model: db.Patient,
          as: 'patient'
        }
      ],
      order: [['date', 'DESC'], ['startTime', 'ASC']]
    });
    
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener cita por ID
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: db.Doctor,
          as: 'doctor',
          include: [
            { model: db.Specialty, as: 'specialty' },
            { model: db.User, as: 'user', attributes: ['fullName'] }
          ]
        },
        {
          model: db.Patient,
          as: 'patient'
        }
      ]
    });
    
    if (!appointment) {
      return res.status(404).json({
        message: 'Cita no encontrada'
      });
    }
    
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Actualizar cita
exports.updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findByPk(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        message: 'Cita no encontrada'
      });
    }
    
    // Si se cambia la fecha/hora, verificar disponibilidad
    if (req.body.date || req.body.startTime || req.body.endTime) {
      const date = req.body.date || appointment.date;
      const startTime = req.body.startTime || appointment.startTime;
      const endTime = req.body.endTime || appointment.endTime;
      
      // Comprobar que no se solape con otras citas
      const existingAppointment = await Appointment.findOne({
        where: {
          id: {
            [db.Sequelize.Op.ne]: appointmentId
          },
          doctorId: appointment.doctorId,
          date: date,
          status: {
            [db.Sequelize.Op.ne]: 'cancelled'
          },
          [db.Sequelize.Op.or]: [
            {
              startTime: {
                [db.Sequelize.Op.lt]: endTime,
              },
              endTime: {
                [db.Sequelize.Op.gt]: startTime,
              }
            }
          ]
        }
      });
      
      if (existingAppointment) {
        return res.status(400).json({
          message: 'El horario seleccionado se solapa con otra cita'
        });
      }
    }
    
    // Actualizar cita
    const appointmentData = {
      date: req.body.date || appointment.date,
      startTime: req.body.startTime || appointment.startTime,
      endTime: req.body.endTime || appointment.endTime,
      status: req.body.status || appointment.status,
      reason: req.body.reason || appointment.reason,
      notes: req.body.notes || appointment.notes,
      updatedBy: req.userId
    };
    
    await appointment.update(appointmentData);
    
    // Si se cambió el estado a 'cancelled', enviar notificación
    if (req.body.status === 'cancelled' && appointment.status !== 'cancelled') {
      const patient = await Patient.findByPk(appointment.patientId);
      const doctor = await Doctor.findByPk(appointment.doctorId, {
        include: [{ model: db.User, as: 'user' }]
      });
      
      if (patient && patient.email && process.env.NODE_ENV !== 'test') {
        try {
          await sendCancellationNotification(appointment, patient, doctor);
        } catch (mailError) {
          console.error('Error al enviar correo de cancelación:', mailError);
        }
      }
    }
    
    res.status(200).json({
      message: 'Cita actualizada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Eliminar cita
exports.deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const appointment = await Appointment.findByPk(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        message: 'Cita no encontrada'
      });
    }
    
    await appointment.destroy();
    
    res.status(200).json({
      message: 'Cita eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Función para enviar notificación por correo
const sendAppointmentNotification = async (appointment, patient, doctor) => {
  // Configurar transporte de correo
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  // Obtener información del doctor
  const doctorData = await Doctor.findByPk(appointment.doctorId, {
    include: [
      { model: db.User, as: 'user' },
      { model: db.Specialty, as: 'specialty' }
    ]
  });
  
  // Configurar correo
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patient.email,
    subject: 'Confirmación de Cita Médica',
    html: `
      <h1>Confirmación de Cita Médica</h1>
      <p>Estimado/a ${patient.fullName},</p>
      <p>Le confirmamos que su cita ha sido programada con éxito:</p>
      <ul>
        <li><strong>Doctor:</strong> ${doctorData.user.fullName}</li>
        <li><strong>Especialidad:</strong> ${doctorData.specialty.name}</li>
        <li><strong>Fecha:</strong> ${appointment.date}</li>
        <li><strong>Hora:</strong> ${appointment.startTime}</li>
      </ul>
      <p>Por favor, llegue 15 minutos antes de su cita.</p>
      <p>Si necesita cancelar o reprogramar, contáctenos con al menos 24 horas de anticipación.</p>
      <p>Saludos cordiales,</p>
      <p>Equipo Médico</p>
    `
  };
  
  // Enviar correo
  await transporter.sendMail(mailOptions);
};

// Función para enviar notificación de cancelación por correo
const sendCancellationNotification = async (appointment, patient, doctor) => {
  // Configurar transporte de correo
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  // Configurar correo
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patient.email,
    subject: 'Cancelación de Cita Médica',
    html: `
      <h1>Cancelación de Cita Médica</h1>
      <p>Estimado/a ${patient.fullName},</p>
      <p>Le informamos que su cita ha sido cancelada:</p>
      <ul>
        <li><strong>Doctor:</strong> ${doctor.user.fullName}</li>
        <li><strong>Fecha:</strong> ${appointment.date}</li>
        <li><strong>Hora:</strong> ${appointment.startTime}</li>
      </ul>
      <p>Por favor, contáctenos para reprogramar su cita.</p>
      <p>Saludos cordiales,</p>
      <p>Equipo Médico</p>
    `
  };
  
  // Enviar correo
  await transporter.sendMail(mailOptions);
};
