const db = require('../models');
const Doctor = db.Doctor;
const User = db.User;
const Specialty = db.Specialty;
const Sector = db.Sector;

async function checkDoctors() {
  try {
    // Obtener todos los doctores con sus relaciones
    const doctors = await Doctor.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'email', 'fullName', 'active'] },
        { model: Specialty, as: 'specialty' },
        { model: Sector, as: 'sector' }
      ]
    });

    console.log('======== INFORMACIÓN DE DOCTORES ========');
    console.log(`Total de doctores: ${doctors.length}`);
    console.log('\n');

    // Mostrar información detallada de cada doctor
    doctors.forEach(doctor => {
      console.log(`ID: ${doctor.id}`);
      console.log(`Nombre: ${doctor.user.fullName}`);
      console.log(`Especialidad: ${doctor.specialty ? doctor.specialty.name : 'No asignada'}`);
      console.log(`Sector: ${doctor.sector ? doctor.sector.name : 'No asignado'}`);
      console.log(`Activo: ${doctor.active ? 'Sí' : 'No'}`);
      console.log(`Días laborables: ${doctor.workingDays ? JSON.stringify(doctor.workingDays) : 'No configurados'}`);
      console.log(`Horario: ${doctor.workingHourStart || 'No configurado'} - ${doctor.workingHourEnd || 'No configurado'}`);
      console.log(`Duración de cita: ${doctor.appointmentDuration || 'No configurada'} minutos`);
      console.log('-----------------------------------');
    });

    // Detalles específicos de la Dra. María López (doctor_id=2)
    const draLopez = doctors.find(doctor => doctor.user.fullName === 'Dra. María López');
    if (draLopez) {
      console.log('\n======== DETALLE DRA. MARÍA LÓPEZ ========');
      console.log(`ID: ${draLopez.id}`);
      console.log(`Días laborables (raw): ${JSON.stringify(draLopez.workingDays)}`);
      console.log(`Tipo de datos workingDays: ${typeof draLopez.workingDays}`);
      if (Array.isArray(draLopez.workingDays)) {
        console.log(`Contenido del array: ${draLopez.workingDays.map(day => typeof day === 'string' ? parseInt(day) : day).join(', ')}`);
      }
      console.log(`Horario: ${draLopez.workingHourStart} - ${draLopez.workingHourEnd}`);
      console.log(`Duración de cita: ${draLopez.appointmentDuration} minutos`);
    } else {
      console.log('\nNo se encontró a la Dra. María López');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error al verificar doctores:', error);
    process.exit(1);
  }
}

// Ejecutar la función
checkDoctors();
