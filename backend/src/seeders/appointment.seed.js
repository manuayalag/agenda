const db = require('../models');
const { Op } = require('sequelize');
const Appointment = db.Appointment;
const Prestador = db.Prestador;
const Servicio = db.Servicio;
const Patient = db.Patient;
const User = db.User;

/**
 * Función para generar una fecha y hora aleatoria entre dos fechas
 * @param {Date} start - Fecha de inicio
 * @param {Date} end - Fecha de fin
 * @returns {Date} - Fecha y hora aleatoria
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Función para formatear una fecha en formato 'YYYY-MM-DD'
 * @param {Date} date - Fecha a formatear
 * @returns {String} - Fecha formateada
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Función para formatear una hora en formato 'HH:MM:SS'
 * @param {Date} date - Fecha que contiene la hora
 * @returns {String} - Hora formateada
 */
function formatTime(date) {
  return date.toTimeString().split(' ')[0];
}

/**
 * Función para calcular el tiempo de fin de una cita
 * @param {Date} startTime - Hora de inicio
 * @param {Number} duration - Duración en minutos
 * @returns {Date} - Hora de fin
 */
function calculateEndTime(startTime, duration) {
  const endTime = new Date(startTime);
  endTime.setMinutes(startTime.getMinutes() + duration);
  return endTime;
}

/**
 * Seeder para la creación de citas médicas
 */
const seedAppointments = async () => {
  try {
    // Obtener todos los prestadores, pacientes, servicios y usuario admin
    const prestadores = await Prestador.findAll();
    const servicios = await Servicio.findAll();
    const patients = await Patient.findAll();
    const adminUser = await User.findOne({ where: { role: 'admin' } });
    // Obtener información de los usuarios (prestadores) por separado
    const prestadorUsers = await User.findAll({ 
      where: { role: 'doctor' },
      attributes: ['id', 'fullName']
    });
    const prestadorUserMap = new Map();
    prestadorUsers.forEach(user => {
      prestadorUserMap.set(user.id, user);
    });
    if (!prestadores.length || !patients.length || !adminUser || !servicios.length) {
      throw new Error('Faltan datos necesarios para crear citas (prestadores, pacientes, servicios o usuario admin)');
    }
    // Crear citas para cada prestador
    for (const prestador of prestadores) {
      // Número aleatorio de citas por prestador (entre 5 y 15)
      const numAppointments = Math.floor(Math.random() * 11) + 5;
      for (let i = 0; i < numAppointments; i++) {
        // Seleccionar paciente y servicio aleatorio
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const servicio = servicios[Math.floor(Math.random() * servicios.length)];
        // Generar fecha y hora aleatoria dentro de los próximos 30 días
        const today = new Date();
        const future = new Date();
        future.setDate(today.getDate() + 30);
        const appointmentDate = randomDate(today, future);
        const dateStr = formatDate(appointmentDate);
        // Ajustar la hora para que sea dentro del horario del prestador
        const prestadorStartHour = parseInt(prestador.workingHourStart.split(':')[0]);
        const prestadorEndHour = parseInt(prestador.workingHourEnd.split(':')[0]);
        const appointmentHour = prestadorStartHour + Math.floor(Math.random() * (prestadorEndHour - prestadorStartHour - 1));
        appointmentDate.setHours(appointmentHour, 0, 0, 0);
        const appointmentDateTime = new Date(appointmentDate);
        // Duración según el servicio
        const duration = servicio.tiempo || prestador.appointmentDuration || 30;
        const endDateTime = calculateEndTime(appointmentDateTime, duration);
        // Log para depuración
        console.log('Servicio seleccionado:', servicio);
        await Appointment.create({
          date: dateStr,
          startTime: formatTime(appointmentDateTime),
          endTime: formatTime(endDateTime),
          patientId: patient.id,
          prestadorId: prestador.id,
          servicioId: servicio.id, // usa el campo correcto según el modelo
          status: 'scheduled',
          createdBy: adminUser.id,
          reason: `Consulta de ${patient.fullName} con ${prestadorUserMap.get(prestador.userId)?.fullName || 'Prestador'} (${servicio.nombre_servicio})`
        });
      }
    }
    console.log('Citas creadas correctamente');
  } catch (error) {
    console.error('Error al crear citas:', error);
  }
};

module.exports = seedAppointments;
