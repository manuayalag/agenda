const db = require('../models');
const Doctor = db.Doctor;
const User = db.User;

// Obtener todos los doctores
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      include: [
        { 
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName', 'active'] 
        },
        { model: db.Specialty, as: 'specialty' },
        { model: db.Sector, as: 'sector' }
      ]
    });
    
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener doctores por sector
exports.getDoctorsBySector = async (req, res) => {
  try {
    const sectorId = req.params.sectorId || req.userSectorId;
    
    const doctors = await Doctor.findAll({
      where: { sectorId: sectorId },
      include: [
        { 
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName', 'active'] 
        },
        { model: db.Specialty, as: 'specialty' },
        { model: db.Sector, as: 'sector' }
      ]
    });
    
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener doctor por ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.params.id, {
      include: [
        { 
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName', 'active'] 
        },
        { model: db.Specialty, as: 'specialty' },
        { model: db.Sector, as: 'sector' }
      ]
    });
    
    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor no encontrado'
      });
    }
    
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Actualizar doctor
exports.updateDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findByPk(doctorId);
    
    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor no encontrado'
      });
    }
    
    const doctorData = {
      specialtyId: req.body.specialtyId || doctor.specialtyId,
      sectorId: req.body.sectorId || doctor.sectorId,
      licenseNumber: req.body.licenseNumber || doctor.licenseNumber,
      workingDays: req.body.workingDays || doctor.workingDays,
      workingHourStart: req.body.workingHourStart || doctor.workingHourStart,
      workingHourEnd: req.body.workingHourEnd || doctor.workingHourEnd,
      appointmentDuration: req.body.appointmentDuration || doctor.appointmentDuration,
      active: req.body.active !== undefined ? req.body.active : doctor.active
    };
    
    await doctor.update(doctorData);
    
    // Si hay información del usuario, actualizar también
    if (req.body.user) {
      const user = await User.findByPk(doctor.userId);
      
      if (user) {
        const userData = {
          fullName: req.body.user.fullName || user.fullName,
          email: req.body.user.email || user.email,
          active: req.body.user.active !== undefined ? req.body.user.active : user.active
        };
        
        await user.update(userData);
      }
    }
    
    res.status(200).json({
      message: 'Doctor actualizado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener disponibilidad del doctor
exports.getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const date = req.query.date; // Formato: YYYY-MM-DD
    
    const doctor = await Doctor.findByPk(doctorId);
    
    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor no encontrado'
      });
    }
    
    // Verificar si el doctor trabaja ese día de la semana
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay() === 0 ? 7 : requestedDate.getDay(); // Domingo = 7
    
    if (!doctor.workingDays.includes(dayOfWeek)) {
      return res.status(200).json({
        available: false,
        message: 'El doctor no atiende este día de la semana',
        slots: []
      });
    }
    
    // Obtener citas del doctor para ese día
    const appointments = await db.Appointment.findAll({
      where: {
        doctorId: doctorId,
        date: date,
        status: {
          [db.Sequelize.Op.ne]: 'cancelled'
        }
      }
    });
    
    // Calcular slots disponibles
    const startHour = new Date(`${date}T${doctor.workingHourStart}`);
    const endHour = new Date(`${date}T${doctor.workingHourEnd}`);
    const appointmentDuration = doctor.appointmentDuration || 30; // minutos
    
    const slots = [];
    let currentSlot = new Date(startHour);
    
    while (currentSlot < endHour) {
      const slotEnd = new Date(currentSlot.getTime() + appointmentDuration * 60000);
      
      // Verificar si el slot está ocupado
      const isSlotTaken = appointments.some(appointment => {
        const appointmentStart = new Date(`${date}T${appointment.startTime}`);
        const appointmentEnd = new Date(`${date}T${appointment.endTime}`);
        
        return (
          (currentSlot >= appointmentStart && currentSlot < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
          (currentSlot <= appointmentStart && slotEnd >= appointmentEnd)
        );
      });
      
      if (!isSlotTaken) {
        slots.push({
          start: currentSlot.toISOString().substring(11, 16), // HH:mm
          end: slotEnd.toISOString().substring(11, 16) // HH:mm
        });
      }
      
      currentSlot = slotEnd;
    }
    
    res.status(200).json({
      available: slots.length > 0,
      slots: slots
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
