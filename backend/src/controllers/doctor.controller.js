const db = require('../models');
const Doctor = db.Doctor;
const User = db.User;
const Appointment = db.Appointment;
const { Op } = require('sequelize');

// Función de utilidad para verificar fechas y días de la semana
const testDateDay = (dateString) => {
  const date = new Date(dateString);
  const jsDay = date.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
  const convertedDay = jsDay === 0 ? 7 : jsDay; // Convertir a 1-7 (lunes a domingo)
  
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  console.log(`Fecha: ${dateString}`);
  console.log(`Día JavaScript (0-6): ${jsDay} (${days[jsDay]})`);
  console.log(`Día convertido (1-7): ${convertedDay}`);
  console.log('-----------------');
  
  return convertedDay;
};

// Obtener todos los doctores
exports.getAllDoctors = async (req, res) => {
  try {
    // Verificar usuario actual para aplicar filtros según el rol
    const currentUser = await db.User.findByPk(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Opciones de búsqueda básicas
    const findOptions = {
      include: [
        { 
          model: db.User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'fullName', 'active'] 
        },
        { model: db.Specialty, as: 'specialty' },
        { model: db.Sector, as: 'sector' }
      ]
    };
    
    // Si es admin de sector, filtramos por su sector
    if (currentUser.role === 'sector_admin' && currentUser.sectorId) {
      findOptions.where = { sectorId: currentUser.sectorId };
    }
    
    const doctors = await Doctor.findAll(findOptions);
    
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    res.status(500).json({
      message: error.message || 'Error al obtener la lista de doctores'
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

// Obtener disponibilidad del doctor para una fecha específica
exports.getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const date = req.query.date;

    if (!date) {
      return res.status(400).json({
        message: 'Se requiere la fecha para verificar disponibilidad'
      });
    }

    // Obtener información del doctor
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({
        message: 'Doctor no encontrado'
      });
    }    // Verificar si la fecha es un día laborable para el doctor
    console.log('Verificando disponibilidad para doctor:', doctor.id);
    console.log('Fecha solicitada:', date);
    
    // Test específico para los días que mencionaste
    console.log('TEST DE FECHAS:');
    const martes = testDateDay('2025-06-17');  // Martes
    const jueves = testDateDay('2025-06-19');  // Jueves    // Verificar para la fecha actual - CORREGIDO para evitar problemas de zona horaria
    // En lugar de new Date(date) que puede tener problemas con zona horaria, descomponemos la fecha
    const [year, month, day] = date.split('-').map(Number);
    const requestDate = new Date(year, month - 1, day); // Meses en JS son 0-indexed
    const requestDay = requestDate.getDay();
    // Convertir de 0-6 (domingo a sábado) a 1-7 (lunes a domingo)
    const dayNumber = requestDay === 0 ? 7 : requestDay;
    
    console.log('Para la fecha solicitada:', date);
    console.log('Fecha construida correctamente:', requestDate);
    console.log('Día de la semana JavaScript getDay():', requestDay);
    console.log('Día de la semana convertido (1-7):', dayNumber);
    console.log('Nombre del día:', ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][requestDay]);
    console.log('Días laborables del doctor:', doctor.workingDays);
      // Convertir workingDays a números para asegurar una comparación correcta
    const workingDaysNumbers = doctor.workingDays ? 
      doctor.workingDays.map(day => typeof day === 'string' ? parseInt(day) : day) : 
      [];
    
    console.log('Días laborables (como números):', workingDaysNumbers);
    
    // Corregir la verificación del día:
    // JS: 0(Dom), 1(Lun), 2(Mar), 3(Mié), 4(Jue), 5(Vie), 6(Sáb)
    // DB: 1(Lun), 2(Mar), 3(Mié), 4(Jue), 5(Vie), 6(Sáb), 7(Dom)
    const isDoctorWorking = workingDaysNumbers.includes(dayNumber);
    console.log('¿El doctor trabaja este día?', isDoctorWorking);
    
    // Ver si el doctor trabaja ese día o tiene horario configurado
    if (!doctor.workingDays || !isDoctorWorking || !doctor.workingHourStart || !doctor.workingHourEnd) {
      console.log('El doctor no trabaja este día o no tiene horario configurado:',
        !doctor.workingDays ? 'Sin días laborables' : 
        !isDoctorWorking ? 'No trabaja este día' : 
        !doctor.workingHourStart || !doctor.workingHourEnd ? 'Horario no configurado' : ''
      );      const reason = !doctor.workingDays ? 'no_working_days' : 
                    !isDoctorWorking ? 'not_working_this_day' : 
                    'no_working_hours';
                    
      return res.status(200).json({
        message: 'El doctor no trabaja este día o no tiene horario configurado',
        reason: reason,
        availableSlots: [],
        workingInfo: {
          hasWorkingDays: !!doctor.workingDays,
          workingDays: doctor.workingDays || [],
          hasWorkingHours: !!(doctor.workingHourStart && doctor.workingHourEnd),
          workingHourStart: doctor.workingHourStart,
          workingHourEnd: doctor.workingHourEnd
        }
      });
    }

    // Horario de trabajo del doctor
    const workStartTime = doctor.workingHourStart;
    const workEndTime = doctor.workingHourEnd;
    const appointmentDuration = doctor.appointmentDuration || 30; // por defecto 30 min si no tiene definido    // Obtener todas las citas del doctor para esa fecha
    const appointments = await Appointment.findAll({
      where: {
        doctorId: doctorId,
        date: date,
        status: {
          [Op.ne]: 'cancelled' // Ignorar citas canceladas
        }
      },
      order: [['startTime', 'ASC']]
    });
    
    console.log(`Citas existentes para doctor ${doctorId} en fecha ${date}:`, appointments.map(app => ({
      id: app.id,
      startTime: app.startTime,
      endTime: app.endTime,
      status: app.status
    })));

    // Generar slots disponibles
    const availableSlots = [];
    
    // Convertir string de hora a minutos para cálculos
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (hours * 60) + minutes;
    };
    
    // Convertir minutos a string de hora para API
    const minutesToTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
    };    // Calcular todos los slots posibles en el horario de trabajo
    const startMinutes = timeToMinutes(workStartTime);
    const endMinutes = timeToMinutes(workEndTime);
    
    console.log('Generando slots de disponibilidad:');
    console.log('Horario de trabajo del doctor:', workStartTime, 'a', workEndTime);
    console.log('Duración de cita:', appointmentDuration, 'minutos');
    console.log('Horario en minutos:', startMinutes, 'a', endMinutes);
      // Crear slots dentro del horario de trabajo
    console.log('Intentando generar slots para horario:', workStartTime, 'a', workEndTime, '(duración cita:', appointmentDuration, 'min)');
    
    // Verificar que tenemos horarios válidos antes de intentar generar slots
    if (!workStartTime || !workEndTime || startMinutes >= endMinutes) {
      console.warn('Horario de trabajo inválido o mal configurado:', { startMinutes, endMinutes });
    } else {
      for (let slotStart = startMinutes; slotStart + appointmentDuration <= endMinutes; slotStart += appointmentDuration) {
        const slotEnd = slotStart + appointmentDuration;
        const slot = {
          start: minutesToTime(slotStart),
          end: minutesToTime(slotEnd)
        };
        console.log(`Evaluando slot: ${slot.start} - ${slot.end}`);
        
        // Verificar si el slot está disponible (no se solapa con ninguna cita)
        let isAvailable = true;
        for (const appointment of appointments) {
          const appointmentStart = timeToMinutes(appointment.startTime);
          const appointmentEnd = timeToMinutes(appointment.endTime);

          // Mejor lógica de detección de solapamiento
          // Un slot se solapa si:
          // - El inicio del slot está entre el inicio y fin de la cita
          // - El fin del slot está entre el inicio y fin de la cita
          // - El slot contiene completamente a la cita
          if (
            (slotStart >= appointmentStart && slotStart < appointmentEnd) || // inicio del slot dentro de la cita
            (slotEnd > appointmentStart && slotEnd <= appointmentEnd) || // fin del slot dentro de la cita
            (slotStart <= appointmentStart && slotEnd >= appointmentEnd) // slot contiene a la cita
          ) {
            isAvailable = false;
            console.log(`Slot ${minutesToTime(slotStart)}-${minutesToTime(slotEnd)} se solapa con cita ${appointment.startTime}-${appointment.endTime}`);
            break;
          }
        }

        if (isAvailable) {
          console.log(`Slot disponible añadido: ${slot.start} - ${slot.end}`);
          availableSlots.push(slot);
        }
      }
    }// Verificar si se generaron slots disponibles
    console.log('Total de slots generados:', availableSlots.length);
    
    // Identificar la razón por la que no hay slots disponibles
    let noSlotsReason = null;
    
    if (availableSlots.length === 0) {
      console.log('ADVERTENCIA: No se generaron slots disponibles para el doctor en esta fecha.');
      console.log('Datos del doctor:', {
        id: doctor.id,
        workingDays: doctor.workingDays,
        workingHourStart: doctor.workingHourStart,
        workingHourEnd: doctor.workingHourEnd,
        appointmentDuration: doctor.appointmentDuration
      });
      
      // Verificar por qué no se generaron slots
      const startMinutes = timeToMinutes(workStartTime);
      const endMinutes = timeToMinutes(workEndTime);
      console.log('Horario en minutos:', startMinutes, 'a', endMinutes, '(duración:', appointmentDuration, 'min)');
      
      // Determinar la razón por la que no hay slots disponibles
      if (!doctor.workingHourStart || !doctor.workingHourEnd) {
        noSlotsReason = 'no_working_hours';
      } else if (startMinutes >= endMinutes) {
        noSlotsReason = 'invalid_working_hours';
      } else if (appointments.length > 0) {
        // Comprobar si todas las horas del día están ocupadas
        const totalTimeSlots = Math.floor((endMinutes - startMinutes) / appointmentDuration);
        if (totalTimeSlots <= appointments.length) {
          noSlotsReason = 'all_slots_booked';
        } else {
          // Si hay más slots posibles que citas, pero aún no hay disponibles,
          // probablemente es por la fragmentación del horario
          noSlotsReason = 'fragmented_schedule';
        }
      } else {
        noSlotsReason = 'unknown';
      }
      
      console.log('Razón por la que no hay slots disponibles:', noSlotsReason);
    }
    
    // Devolver los slots disponibles
    return res.status(200).json({
      doctor: doctor.id,
      date: date,
      availableSlots: availableSlots,
      reason: noSlotsReason,
      workingHours: {
        start: workStartTime,
        end: workEndTime,
        duration: appointmentDuration
      },
      appointments: appointments.length,
      workingInfo: {
        hasWorkingDays: !!doctor.workingDays,
        workingDays: doctor.workingDays || [],
        hasWorkingHours: !!(doctor.workingHourStart && doctor.workingHourEnd),
        workingHourStart: doctor.workingHourStart,
        workingHourEnd: doctor.workingHourEnd
      }
    });

  } catch (error) {
    console.error('Error al obtener disponibilidad del doctor:', error);
    res.status(500).json({
      message: error.message || 'Error al obtener disponibilidad del doctor'
    });
  }
};
