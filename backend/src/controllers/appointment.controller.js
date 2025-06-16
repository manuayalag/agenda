const db = require('../models');
const Appointment = db.Appointment;
const Doctor = db.Doctor;
const Patient = db.Patient;
const nodemailer = require('nodemailer');

// Crear una cita
exports.createAppointment = async (req, res) => {
  try {
    console.log('Datos recibidos para crear cita:', req.body);
      // Verificar si se está enviando un objeto paciente completo o solo el ID del paciente
    let patientId;
    
    if (req.body.patient && req.body.patient.documentId) {
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
      patientId = patient.id;
    } else if (req.body.patientId) {
      // Si solo se envía el ID del paciente, usarlo directamente
      patientId = req.body.patientId;
      
      // Verificar que el paciente existe
      const patientExists = await Patient.findByPk(patientId);
      if (!patientExists) {
        return res.status(404).json({
          message: 'Paciente no encontrado'
        });
      }
    } else {
      return res.status(400).json({
        message: 'Se requiere información del paciente (patientId o datos completos)'
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
    const existingAppointments = await Appointment.findAll({
      where: {
        doctorId: req.body.doctorId,
        date: appointmentDate,
        status: {
          [db.Sequelize.Op.ne]: 'cancelled'
        }
      }
    });

    // Convertir horas a minutos para facilitar la comparación
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (hours * 60) + minutes;
    };
    
    const appointmentStart = timeToMinutes(startTime);
    const appointmentEnd = timeToMinutes(endTime);
    
    console.log(`Verificando solapamiento para cita nueva: ${startTime}-${endTime}`);
    console.log('Citas existentes:', existingAppointments.map(app => `${app.id}: ${app.startTime}-${app.endTime}`));
    
    // Verificar solapamiento con cualquier cita existente
    const overlappingAppointment = existingAppointments.find(existing => {
      const existingStart = timeToMinutes(existing.startTime);
      const existingEnd = timeToMinutes(existing.endTime);
      
      // Verificar solapamiento
      const overlaps = (
        (appointmentStart >= existingStart && appointmentStart < existingEnd) || // inicio de la nueva dentro de existente
        (appointmentEnd > existingStart && appointmentEnd <= existingEnd) || // fin de la nueva dentro de existente
        (appointmentStart <= existingStart && appointmentEnd >= existingEnd) // nueva contiene a existente
      );
      
      if (overlaps) {
        console.log(`Solapamiento detectado con la cita ${existing.id}: ${existing.startTime}-${existing.endTime}`);
      }
      
      return overlaps;
    });
    
    if (overlappingAppointment) {
      return res.status(400).json({
        message: `El horario seleccionado se solapa con otra cita (${overlappingAppointment.startTime} - ${overlappingAppointment.endTime})`
      });
    }
      // Crear la cita
    const appointment = await Appointment.create({
      doctorId: req.body.doctorId,
      patientId: patientId, // Usar el ID del paciente que determinamos arriba
      date: appointmentDate,
      startTime: startTime,
      endTime: endTime,
      reason: req.body.reason,
      notes: req.body.notes,
      status: req.body.status || 'scheduled',
      createdBy: req.userId
    });    // Enviar notificación por correo si se proporcionó email
    try {
      // Obtener los datos completos del paciente
      const patientComplete = await Patient.findByPk(patientId);
      
      if (patientComplete && patientComplete.email && process.env.NODE_ENV !== 'test') {
        try {
          await sendAppointmentNotification(appointment, patientComplete, doctor);
          console.log(`Notificación de cita enviada a ${patientComplete.email}`);
        } catch (mailSendError) {
          console.error('Error al enviar el correo:', mailSendError);
          // No bloqueamos la creación de la cita por un error en el correo
        }
      } else {
        console.log('No se enviará notificación: Paciente sin email o entorno de pruebas');
      }
    } catch (mailError) {
      console.error('Error al preparar notificación de correo:', mailError);
      // No bloqueamos la creación de la cita por un error en el correo
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
    const { sectorId, startDate, endDate, status, page = 1, limit = 10, doctorId } = req.query;
    
    // Convertir a números para paginación
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    
    // Verificar rol de usuario y asignar permisos correspondientes
    const user = await db.User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Dependiendo del rol, aplicamos lógica diferente
    const where = {};
    const doctorWhere = {};
    
    // Si es doctor, solo mostrar sus propias citas
    if (user.role === 'doctor') {
      const doctor = await db.Doctor.findOne({ where: { userId: user.id } });
      if (doctor) {
        return exports.getDoctorAppointments({ 
          ...req, 
          params: { doctorId: doctor.id }, 
          doctorId: doctor.id
        }, res);
      } else {
        // Si no tiene asociación con doctor, devolver array vacío
        return res.status(200).json({
          data: [],
          pagination: {
            totalItems: 0,
            totalPages: 1,
            currentPage: 1,
            itemsPerPage: limitNum
          }
        });
      }
    }
    
    // Filtrar por doctor específico si se proporciona
    if (doctorId) {
      where.doctorId = doctorId;
    }
    
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
    }    // Contar total de registros para paginación
    const count = await Appointment.count({
      where: where,
      include: [
        {
          model: db.Doctor,
          as: 'doctor',
          where: Object.keys(doctorWhere).length ? doctorWhere : null,
          required: Object.keys(doctorWhere).length > 0
        }
      ]
    });
    
    // Obtener citas con paginación
    const appointments = await Appointment.findAll({
      where: where,
      include: [
        {
          model: db.Doctor,
          as: 'doctor',
          where: Object.keys(doctorWhere).length ? doctorWhere : null,
          required: Object.keys(doctorWhere).length > 0,
          include: [
            { model: db.Specialty, as: 'specialty' },
            { model: db.User, as: 'user', attributes: ['fullName'] },
            { model: db.Sector, as: 'sector' }
          ]
        },
        {
          model: db.Patient,
          as: 'patient'
        }
      ],
      order: [['date', 'DESC'], ['startTime', 'ASC']],
      limit: limitNum,
      offset: offset
    });
    
    // Calcular número total de páginas
    const totalPages = Math.ceil(count / limitNum);
    
    // Estructura de respuesta para el frontend
    res.status(200).json({
      data: appointments,
      pagination: {
        totalItems: count,
        totalPages: totalPages,
        currentPage: pageNum,
        itemsPerPage: limitNum
      }
    });
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
    const { startDate, endDate, status, page = 1, limit = 10 } = req.query;
    
    // Convertir a números para paginación
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;
    
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
    
    // Contar total de registros para paginación
    const count = await Appointment.count({
      where: where
    });
    
    // Obtener citas con paginación
    const appointments = await Appointment.findAll({
      where: where,
      include: [
        {
          model: db.Patient,
          as: 'patient'
        },
        {
          model: db.Doctor,
          as: 'doctor',
          include: [
            { model: db.Specialty, as: 'specialty' },
            { model: db.User, as: 'user', attributes: ['fullName'] }
          ]
        }
      ],
      order: [['date', 'DESC'], ['startTime', 'ASC']],
      limit: limitNum,
      offset: offset
    });
    
    // Calcular número total de páginas
    const totalPages = Math.ceil(count / limitNum);
    
    // Estructura de respuesta consistente para el frontend
    res.status(200).json({
      data: appointments,
      pagination: {
        totalItems: count,
        totalPages: totalPages,
        currentPage: pageNum,
        itemsPerPage: limitNum
      }
    });
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
      // Si se cambia la fecha/hora o el doctor, verificar disponibilidad
    if (req.body.date || req.body.startTime || req.body.endTime || req.body.doctorId) {
      const date = req.body.date || appointment.date;
      const startTime = req.body.startTime || appointment.startTime;
      const endTime = req.body.endTime || appointment.endTime;
      const doctorId = req.body.doctorId || appointment.doctorId;
        // Comprobar que no se solape con otras citas
      const existingAppointments = await Appointment.findAll({
        where: {
          id: {
            [db.Sequelize.Op.ne]: appointmentId
          },
          doctorId: doctorId,
          date: date,
          status: {
            [db.Sequelize.Op.ne]: 'cancelled'
          }
        }
      });
      
      // Convertir horas a minutos para facilitar la comparación
      const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return (hours * 60) + minutes;
      };
      
      const appointmentStart = timeToMinutes(startTime);
      const appointmentEnd = timeToMinutes(endTime);
      
      console.log(`Verificando solapamiento para actualización de cita: ${startTime}-${endTime}`);
      console.log('Citas existentes:', existingAppointments.map(app => `${app.id}: ${app.startTime}-${app.endTime}`));
      
      // Verificar solapamiento con cualquier cita existente
      const overlappingAppointment = existingAppointments.find(existing => {
        const existingStart = timeToMinutes(existing.startTime);
        const existingEnd = timeToMinutes(existing.endTime);
        
        // Verificar solapamiento
        const overlaps = (
          (appointmentStart >= existingStart && appointmentStart < existingEnd) || // inicio de la nueva dentro de existente
          (appointmentEnd > existingStart && appointmentEnd <= existingEnd) || // fin de la nueva dentro de existente
          (appointmentStart <= existingStart && appointmentEnd >= existingEnd) // nueva contiene a existente
        );
        
        if (overlaps) {
          console.log(`Solapamiento detectado con la cita ${existing.id}: ${existing.startTime}-${existing.endTime}`);
        }
        
        return overlaps;
      });
      
      if (overlappingAppointment) {
        return res.status(400).json({
          message: `El horario seleccionado se solapa con otra cita (${overlappingAppointment.startTime} - ${overlappingAppointment.endTime})`
        });
      }
    }
      // Actualizar cita
    const appointmentData = {
      date: req.body.date || appointment.date,
      startTime: req.body.startTime || appointment.startTime,
      endTime: req.body.endTime || appointment.endTime,
      doctorId: req.body.doctorId || appointment.doctorId,
      patientId: req.body.patientId || appointment.patientId,
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
  // Verificar que tenemos información válida del paciente
  if (!patient || !patient.email) {
    console.log('No se puede enviar notificación: paciente o email no definidos');
    return;
  }
  
  // Verificar que tenemos las variables de entorno necesarias
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('No se puede enviar notificación: credenciales de email no configuradas');
    return;
  }
  
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
    // Verificar que la información del doctor es válida
  if (!doctorData || !doctorData.user || !doctorData.specialty) {
    console.log('No se puede enviar notificación: información del doctor incompleta');
    return;
  }
  
  // Configurar correo
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patient.email,
    subject: 'Confirmación de Cita Médica',
    html: `
      <h1>Confirmación de Cita Médica</h1>
      <p>Estimado/a ${patient.fullName || 'Paciente'},</p>
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
  // Verificar que tenemos información válida del paciente
  if (!patient || !patient.email) {
    console.log('No se puede enviar notificación de cancelación: paciente o email no definidos');
    return;
  }
  
  // Verificar que tenemos las variables de entorno necesarias
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('No se puede enviar notificación de cancelación: credenciales de email no configuradas');
    return;
  }
  
  // Configurar transporte de correo
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
    // Verificar que la información del doctor es válida
  if (!doctor || !doctor.user) {
    console.log('No se puede enviar notificación de cancelación: información del doctor incompleta');
    return;
  }
  
  // Configurar correo
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: patient.email,
    subject: 'Cancelación de Cita Médica',
    html: `
      <h1>Cancelación de Cita Médica</h1>
      <p>Estimado/a ${patient.fullName || 'Paciente'},</p>
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
