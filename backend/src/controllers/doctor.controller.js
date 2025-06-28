const db = require('../models');
const Prestador = db.Prestador;
const User = db.User;
const Appointment = db.Appointment;
const PrestadorHorario = db.PrestadorHorario;
const { Op, Sequelize } = require('sequelize');

// --- FUNCIONES EXISTENTES (SIN CAMBIOS) ---
exports.getAllPrestadores = async (req, res) => {
  try {
    const currentUser = await db.User.findByPk(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    const findOptions = {
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'username', 'email', 'fullName', 'active'] },
        { model: db.Specialty, as: 'specialty' },
        { model: db.Sector, as: 'sector' }
      ]
    };
    if (currentUser.role === 'sector_admin' && currentUser.sectorId) {
      findOptions.where = { sectorId: currentUser.sectorId };
    }
    const prestadores = await Prestador.findAll(findOptions);
    res.status(200).json(prestadores);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error al obtener la lista de prestadores' });
  }
};

exports.getPrestadoresBySector = async (req, res) => {
  try {
    const sectorId = req.params.sectorId;
    const prestadores = await Prestador.findAll({
      where: { sectorId: sectorId },
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'username', 'email', 'fullName', 'active'] },
        { model: db.Specialty, as: 'specialty' },
        { model: db.Sector, as: 'sector' }
      ]
    });
    res.status(200).json(prestadores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPrestadorById = async (req, res) => {
  try {
    const prestador = await Prestador.findByPk(req.params.id, {
      include: [
        { model: db.User, as: 'user' }, { model: db.Specialty, as: 'specialty' }, { model: db.Sector, as: 'sector' }
      ]
    });
    if (!prestador) return res.status(404).json({ message: 'Prestador no encontrado' });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePrestador = async (req, res) => {
    // La lógica original de esta función se mantiene
    const prestador = await Prestador.findByPk(req.params.id);
    if (!prestador) {
        return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    await prestador.update(req.body);
    res.status(200).json({ message: 'Prestador actualizado' });
};

exports.getPrestadorHorarios = async (req, res) => {
    // La lógica original de esta función se mantiene
    const horarios = await db.PrestadorHorario.findAll({ where: { prestadorId: req.params.id }});
    res.json(horarios);
};

exports.addPrestadorHorario = async (req, res) => {
    // La lógica original de esta función se mantiene
    const horario = await db.PrestadorHorario.create({ prestadorId: req.params.id, ...req.body });
    res.json(horario);
};

exports.deletePrestadorHorario = async (req, res) => {
    // La lógica original de esta función se mantiene
    await db.PrestadorHorario.destroy({ where: { id: req.params.scheduleId }});
    res.json({ success: true });
};


// --- NUEVA FUNCIÓN ---
// Obtener disponibilidad para un mes completo.
exports.getMonthlyAvailability = async (req, res) => {
    const { id: prestadorId } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({ message: "Se requiere año y mes." });
    }

    try {
        const workSchedules = await PrestadorHorario.findAll({
            where: { prestadorId },
            attributes: ['dia'],
            group: ['dia']
        });
        const workingDays = new Set(workSchedules.map(h => h.dia));

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const tempDate = new Date(year, month, 0);
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;

        const appointments = await Appointment.findAll({
            where: {
                prestadorId,
                date: { [Op.between]: [startDate, endDate] },
                status: { [Op.ne]: 'cancelled' }
            },
            attributes: ['date', [Sequelize.fn('count', Sequelize.col('id')), 'count']],
            group: ['date']
        });
        
        const appointmentCounts = appointments.reduce((acc, app) => {
            acc[app.get('date')] = app.get('count');
            return acc;
        }, {});
        
        const availability = {};
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(Date.UTC(year, month - 1, day));
            const dayOfWeek = currentDate.getUTCDay() === 0 ? 7 : currentDate.getUTCDay();
            const dateStr = currentDate.toISOString().split('T')[0];

            if (workingDays.has(dayOfWeek)) {
                // Simplificación: si tiene más de 15 citas, se considera lleno.
                // Una lógica más precisa podría calcular los slots disponibles.
                const isFull = (appointmentCounts[dateStr] || 0) > 15;
                availability[dateStr] = isFull ? 'FULL' : 'AVAILABLE';
            } else {
                availability[dateStr] = 'NOT_WORKING';
            }
        }

        res.status(200).json(availability);

    } catch (error) {
        console.error("Error en getMonthlyAvailability:", error);
        res.status(500).json({ message: "Error al obtener la disponibilidad mensual." });
    }
};


// --- FUNCIÓN MODIFICADA ---
// Renombrada de getPrestadorAvailability a getDailyAvailability.
// Devuelve bloques de trabajo y citas existentes para que el frontend calcule los slots.
exports.getDailyAvailability = async (req, res) => {
  const { id: prestadorId, date } = req.params;

  if (!date) {
    return res.status(400).json({ message: 'Se requiere la fecha para verificar disponibilidad' });
  }

  try {
    // La zona horaria puede ser un problema, usar UTC para consistencia
    const requestDate = new Date(date + 'T00:00:00Z');
    const dayOfWeek = requestDate.getUTCDay() === 0 ? 7 : requestDate.getUTCDay();

    const workBlocks = await PrestadorHorario.findAll({
        where: { prestadorId, dia: dayOfWeek },
        order: [['hora_inicio', 'ASC']]
    });
    
    const existingAppointments = await Appointment.findAll({
        where: {
            prestadorId: prestadorId,
            date: date,
            status: { [Op.ne]: 'cancelled' }
        },
        attributes: ['startTime', 'endTime', 'id'],
        order: [['startTime', 'ASC']]
    });

    res.status(200).json({
        workBlocks: workBlocks.map(b => ({ startTime: b.hora_inicio, endTime: b.hora_fin })),
        existingAppointments
    });

  } catch (error) {
    console.error(`Error en getDailyAvailability para prestador ${prestadorId} en fecha ${date}:`, error);
    res.status(500).json({ message: error.message || 'Error al obtener disponibilidad del prestador' });
  }
};