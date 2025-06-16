const db = require('../models');
const { Op } = require('sequelize');
const Appointment = db.Appointment;
const Doctor = db.Doctor;
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
    // Obtener todos los doctores, pacientes y usuario admin
    const doctors = await Doctor.findAll();
    // Obtener información de los usuarios (doctores) por separado
    const doctorUsers = await User.findAll({ 
      where: { role: 'doctor' },
      attributes: ['id', 'fullName']
    });
    // Crear un mapa para acceder fácilmente a la información del usuario
    const doctorUserMap = new Map();
    doctorUsers.forEach(user => {
      doctorUserMap.set(user.id, user);
    });
    
    const patients = await Patient.findAll();
    const adminUser = await User.findOne({ where: { role: 'admin' } });

    if (!doctors.length || !patients.length || !adminUser) {
      throw new Error('Faltan datos necesarios para crear citas (doctores, pacientes o usuario admin)');
    }

    // Fechas para generar citas (último mes y próximo mes)
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);

    // Estados posibles para citas pasadas
    const pastStatuses = ['completed', 'cancelled', 'no_show'];

    // Crear citas para cada doctor
    const appointments = [];

    for (const doctor of doctors) {
      // Número aleatorio de citas por doctor (entre 5 y 15)
      const numAppointments = 5 + Math.floor(Math.random() * 10);

      for (let i = 0; i < numAppointments; i++) {
        // Seleccionar un paciente aleatorio
        const patient = patients[Math.floor(Math.random() * patients.length)];
        
        // Determinar si la cita es pasada o futura
        const isPastAppointment = Math.random() > 0.6; // 60% de probabilidad de ser cita pasada
        
        // Generar fecha y hora aleatorias según si es pasada o futura
        let appointmentDateTime;
        if (isPastAppointment) {
          appointmentDateTime = randomDate(oneMonthAgo, today);
        } else {
          appointmentDateTime = randomDate(today, oneMonthLater);
        }
        
        // Ajustar la hora para que sea dentro del horario del doctor
        const doctorStartHour = parseInt(doctor.workingHourStart.split(':')[0]);
        const doctorEndHour = parseInt(doctor.workingHourEnd.split(':')[0]);
        
        appointmentDateTime.setHours(
          doctorStartHour + Math.floor(Math.random() * (doctorEndHour - doctorStartHour - 1)),
          Math.floor(Math.random() * 4) * 15, // Minutos: 0, 15, 30 o 45
          0
        );
        
        // Calcular hora de finalización
        const endDateTime = calculateEndTime(appointmentDateTime, doctor.appointmentDuration);
        
        // Determinar el estado de la cita según si es pasada o futura
        let status;
        if (isPastAppointment) {
          status = pastStatuses[Math.floor(Math.random() * pastStatuses.length)];
        } else {
          status = 'scheduled';
        }

        appointments.push({
          doctorId: doctor.id,
          patientId: patient.id,
          date: formatDate(appointmentDateTime),
          startTime: formatTime(appointmentDateTime),
          endTime: formatTime(endDateTime),
          status,
          reason: `Consulta de ${patient.fullName} con ${doctorUserMap.get(doctor.userId)?.fullName || 'Doctor'}`,
          notes: status === 'completed' ? 'Se realizó la consulta con normalidad' : '',
          reminderSent: isPastAppointment,
          createdBy: adminUser.id,
          updatedBy: adminUser.id
        });
      }
    }

    await Appointment.bulkCreate(appointments);
    console.log('✅ Citas creadas exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al crear citas:', error);
    throw error;
  }
};

module.exports = seedAppointments;
