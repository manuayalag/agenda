// src/controllers/doctor.controller.js

const db = require('../models');
const Prestador = db.Prestador;
const User = db.User;
const Appointment = db.Appointment;
const PrestadorHorario = db.PrestadorHorario;
const PrestadorAusencia = db.PrestadorAusencia;
const { Op, Sequelize } = require('sequelize');

exports.createPrestador = async (req, res) => {
  try {
    const { userId, specialtyId, sectorId, notes, active, licenseNumber } = req.body;
    const existingPrestador = await Prestador.findOne({ where: { userId: userId } });
    if (existingPrestador) {
      return res.status(400).send({ message: "Este usuario ya está asignado a otro perfil de doctor." });
    }
    const existingLicense = await Prestador.findOne({ where: { licenseNumber: licenseNumber } });
    if (existingLicense) {
        return res.status(400).send({ message: "Este número de matrícula ya está en uso." });
    }
    const prestador = await Prestador.create({ userId, specialtyId, sectorId, licenseNumber, notes, active });
    res.status(201).send(prestador);
  } catch (error) {
    res.status(500).send({ message: error.message || "Ocurrió un error al crear el perfil del doctor." });
  }
};

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
    const prestador = await Prestador.findByPk(req.params.id);
    if (!prestador) {
        return res.status(404).json({ message: 'Prestador no encontrado' });
    }
    await prestador.update(req.body);
    res.status(200).json({ message: 'Prestador actualizado' });
};

exports.getPrestadorHorarios = async (req, res) => {
    const horarios = await db.PrestadorHorario.findAll({ where: { prestadorId: req.params.id }});
    res.json(horarios);
};

exports.addPrestadorHorario = async (req, res) => {
    const horario = await db.PrestadorHorario.create({ prestadorId: req.params.id, ...req.body });
    res.json(horario);
};

exports.deletePrestadorHorario = async (req, res) => {
    await db.PrestadorHorario.destroy({ where: { id: req.params.scheduleId }});
    res.json({ success: true });
};

// Obtener disponibilidad para un mes completo (obsoleto, pero se mantiene por si acaso)
exports.getMonthlyAvailability = async (req, res) => {
    // ... (lógica anterior)
};

// Obtener disponibilidad para un día específico
exports.getDailyAvailability = async (req, res) => {
  const { id: prestadorId, date } = req.params;
  if (!date) {
    return res.status(400).json({ message: 'Se requiere la fecha para verificar disponibilidad' });
  }
  try {
    const requestDate = new Date(date + 'T00:00:00Z');
    const dayOfWeek = requestDate.getUTCDay() === 0 ? 7 : requestDate.getUTCDay();
    const [workBlocks, existingAppointments, absences] = await Promise.all([
      PrestadorHorario.findAll({ where: { prestadorId, dia: dayOfWeek }, order: [['hora_inicio', 'ASC']] }),
      Appointment.findAll({ where: { prestadorId, date, status: { [Op.ne]: 'cancelled' } }, attributes: ['startTime', 'endTime', 'id'], order: [['startTime', 'ASC']] }),
      PrestadorAusencia.findAll({ where: { prestadorId, fecha_inicio: { [Op.lte]: date }, fecha_fin: { [Op.gte]: date } } })
    ]);
    res.status(200).json({
        workBlocks: workBlocks.map(b => ({ startTime: b.hora_inicio, endTime: b.hora_fin })),
        existingAppointments,
        absences: absences.map(a => ({ startTime: a.hora_inicio, endTime: a.hora_fin }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error al obtener disponibilidad del prestador' });
  }
};

// --- NUEVA FUNCIÓN PARA OBTENER TODO EL CALENDARIO MENSUAL ---
exports.getMonthlySchedule = async (req, res) => {
    const { id: prestadorId } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({ message: "Se requiere año y mes." });
    }

    try {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const [appointments, absences, workBlocks] = await Promise.all([
            Appointment.findAll({
                where: { prestadorId, date: { [Op.between]: [startDate, endDate] }, status: { [Op.ne]: 'cancelled' } },
                attributes: ['date', 'startTime', 'endTime']
            }),
            PrestadorAusencia.findAll({
                where: {
                    prestadorId,
                    [Op.or]: [
                        { fecha_inicio: { [Op.between]: [startDate, endDate] } },
                        { fecha_fin: { [Op.between]: [startDate, endDate] } },
                        { [Op.and]: [{ fecha_inicio: { [Op.lte]: startDate } }, { fecha_fin: { [Op.gte]: endDate } }] }
                    ]
                }
            }),
            PrestadorHorario.findAll({ where: { prestadorId } })
        ]);

        res.status(200).json({ appointments, absences, workBlocks });

    } catch (error) {
        console.error("Error en getMonthlySchedule:", error);
        res.status(500).json({ message: "Error al obtener el calendario mensual." });
    }
};

// --- CONTROLADORES PARA AUSENCIAS ---
exports.getAusencias = async (req, res) => {
    try {
        const ausencias = await PrestadorAusencia.findAll({
            where: { prestadorId: req.params.id },
            order: [['fecha_inicio', 'DESC']]
        });
        res.status(200).json(ausencias);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las ausencias.' });
    }
};

exports.addAusencia = async (req, res) => {
    try {
        const ausencia = await PrestadorAusencia.create({
            prestadorId: req.params.id,
            ...req.body
        });
        res.status(201).json(ausencia);
    } catch (error) {
        res.status(400).json({ message: 'Error al crear la ausencia.', error: error.message });
    }
};

exports.deleteAusencia = async (req, res) => {
    try {
        await PrestadorAusencia.destroy({ where: { id: req.params.absenceId } });
        res.status(200).json({ success: true, message: 'Ausencia eliminada.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la ausencia.' });
    }
};