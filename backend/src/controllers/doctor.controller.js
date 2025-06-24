const db = require('../models');
const Prestador = db.Prestador;
const User = db.User;
const Appointment = db.Appointment;
const PrestadorHorario = db.PrestadorHorario;
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

// Obtener todos los prestadores
exports.getAllPrestadores = async (req, res) => {
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
    
    const prestadores = await Prestador.findAll(findOptions);
    
    res.status(200).json(prestadores);
  } catch (error) {
    console.error('Error al obtener prestadores:', error);
    res.status(500).json({
      message: error.message || 'Error al obtener la lista de prestadores'
    });
  }
};

// Obtener prestadores por sector
exports.getPrestadoresBySector = async (req, res) => {
  try {
    const sectorId = req.params.sectorId || req.userSectorId;
    
    const prestadores = await Prestador.findAll({
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
    
    res.status(200).json(prestadores);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener prestador por ID
exports.getPrestadorById = async (req, res) => {
  try {
    const prestador = await Prestador.findByPk(req.params.id, {
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
    
    if (!prestador) {
      return res.status(404).json({
        message: 'Prestador no encontrado'
      });
    }
    
    res.status(200).json(prestador);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Actualizar prestador
exports.updatePrestador = async (req, res) => {
  try {
    const prestadorId = req.params.id;
    const prestador = await Prestador.findByPk(prestadorId);
    
    if (!prestador) {
      return res.status(404).json({
        message: 'Prestador no encontrado'
      });
    }
    
    const prestadorData = {
      specialtyId: req.body.specialtyId || prestador.specialtyId,
      sectorId: req.body.sectorId || prestador.sectorId,
      licenseNumber: req.body.licenseNumber || prestador.licenseNumber,
      workingDays: req.body.workingDays || prestador.workingDays,
      workingHourStart: req.body.workingHourStart || prestador.workingHourStart,
      workingHourEnd: req.body.workingHourEnd || prestador.workingHourEnd,
      appointmentDuration: req.body.appointmentDuration || prestador.appointmentDuration,
      active: req.body.active !== undefined ? req.body.active : prestador.active
    };
    
    await prestador.update(prestadorData);
    
    // Si hay información del usuario, actualizar también
    if (req.body.user) {
      const user = await User.findByPk(prestador.userId);
      
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
      message: 'Prestador actualizado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener disponibilidad del prestador para una fecha específica
exports.getPrestadorAvailability = async (req, res) => {
  try {
    const prestadorId = req.params.id;
    const date = req.query.date;

    if (!date) {
      return res.status(400).json({
        message: 'Se requiere la fecha para verificar disponibilidad'
      });
    }

    // Obtener información del prestador
    const prestador = await Prestador.findByPk(prestadorId);
    if (!prestador) {
      return res.status(404).json({
        message: 'Prestador no encontrado'
      });
    }    // Verificar si la fecha es un día laborable para el prestador
    console.log('Verificando disponibilidad para prestador:', prestador.id);
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
    console.log('Días laborables del prestador:', prestador.workingDays);
      // Convertir workingDays a números para asegurar una comparación correcta
    const workingDaysNumbers = prestador.workingDays ? 
      prestador.workingDays.map(day => typeof day === 'string' ? parseInt(day) : day) : 
      [];
    
    console.log('Días laborables (como números):', workingDaysNumbers);
    
    // Corregir la verificación del día:
    // JS: 0(Dom), 1(Lun), 2(Mar), 3(Mié), 4(Jue), 5(Vie), 6(Sáb)
    // DB: 1(Lun), 2(Mar), 3(Mié), 4(Jue), 5(Vie), 6(Sáb), 7(Dom)
    const isPrestadorWorking = workingDaysNumbers.includes(dayNumber);
    console.log('¿El prestador trabaja este día?', isPrestadorWorking);
    
    // Ver si el prestador trabaja ese día o tiene horario configurado
    if (!prestador.workingDays || !isPrestadorWorking || !prestador.workingHourStart || !prestador.workingHourEnd) {
      console.log('El prestador no trabaja este día o no tiene horario configurado:',
        !prestador.workingDays ? 'Sin días laborables' : 
        !isPrestadorWorking ? 'No trabaja este día' : 
        !prestador.workingHourStart || !prestador.workingHourEnd ? 'Horario no configurado' : ''
      );      const reason = !prestador.workingDays ? 'no_working_days' : 
                    !isPrestadorWorking ? 'not_working_this_day' : 
                    'no_working_hours';
                    
      return res.status(200).json({
        message: 'El prestador no trabaja este día o no tiene horario configurado',
        reason: reason,
        availableSlots: [],
        workingInfo: {
          hasWorkingDays: !!prestador.workingDays,
          workingDays: prestador.workingDays || [],
          hasWorkingHours: !!(prestador.workingHourStart && prestador.workingHourEnd),
          workingHourStart: prestador.workingHourStart,
          workingHourEnd: prestador.workingHourEnd
        }
      });
    }

    // Buscar todos los rangos horarios del prestador para ese día
    const horarios = await PrestadorHorario.findAll({
      where: {
        prestadorId: prestadorId,
        dia: dayNumber,
      },
      order: [['hora_inicio', 'ASC']],
    });

    if (!horarios || horarios.length === 0) {
      return res.status(200).json({
        message: 'El prestador no tiene horarios configurados para este día',
        reason: 'no_working_hours',
        availableSlots: [],
        workingInfo: { horarios: [] }
      });
    }

    // Obtener todas las citas del prestador para esa fecha
    const appointments = await Appointment.findAll({
      where: {
        prestadorId: prestadorId,
        date: date,
        status: { [Op.ne]: 'cancelled' }
      },
      order: [['startTime', 'ASC']]
    });

    // Funciones utilitarias
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return (hours * 60) + minutes;
    };
    const minutesToTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
    };

    // Duración del servicio (puedes ajustar para que venga por query si lo necesitas)
    // Por ahora, usa la duración por defecto del prestador
    const appointmentDuration = prestador.appointmentDuration || 30;

    // Generar slots para todos los rangos
    let availableSlots = [];
    for (const rango of horarios) {
      const startMinutes = timeToMinutes(rango.hora_inicio);
      const endMinutes = timeToMinutes(rango.hora_fin);
      for (let slotStart = startMinutes; slotStart + appointmentDuration <= endMinutes; slotStart += appointmentDuration) {
        const slotEnd = slotStart + appointmentDuration;
        const slot = {
          start: minutesToTime(slotStart),
          end: minutesToTime(slotEnd)
        };
        // Verificar solapamiento con citas existentes
        let isAvailable = true;
        for (const appointment of appointments) {
          const appointmentStart = timeToMinutes(appointment.startTime);
          const appointmentEnd = timeToMinutes(appointment.endTime);
          if (
            (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
            (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
            (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
          ) {
            isAvailable = false;
            break;
          }
        }
        if (isAvailable) {
          availableSlots.push(slot);
        }
      }
    }

    return res.status(200).json({
      prestador: prestador.id,
      date: date,
      availableSlots: availableSlots,
      workingInfo: { horarios },
      appointments: appointments.length
    });

  } catch (error) {
    console.error('Error al obtener disponibilidad del prestador:', error);
    res.status(500).json({
      message: error.message || 'Error al obtener disponibilidad del prestador'
    });
  }
};

// Listar horarios de un prestador
exports.getPrestadorHorarios = async (req, res) => {
  try {
    const horarios = await db.PrestadorHorario.findAll({
      where: { prestadorId: req.params.id },
      order: [['dia', 'ASC'], ['hora_inicio', 'ASC']]
    });
    res.json(horarios);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener horarios', error: err.message });
  }
};

// Agregar un horario a un prestador
exports.addPrestadorHorario = async (req, res) => {
  try {
    const { dia, hora_inicio, hora_fin } = req.body;
    const horario = await db.PrestadorHorario.create({
      prestadorId: req.params.id,
      dia,
      hora_inicio,
      hora_fin
    });
    res.json(horario);
  } catch (err) {
    res.status(500).json({ message: 'Error al crear horario', error: err.message });
  }
};

// Eliminar un horario de un prestador
exports.deletePrestadorHorario = async (req, res) => {
  try {
    await db.PrestadorHorario.destroy({
      where: { id: req.params.scheduleId, prestadorId: req.params.id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar horario', error: err.message });
  }
};
