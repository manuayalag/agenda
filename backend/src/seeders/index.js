/**
 * Archivo principal para ejecutar todos los seeders
 */
const db = require('../models');
const bcrypt = require('bcryptjs');

// Seeders individuales
const seedUsers = require('./user.seed');
const seedSectors = require('./sector.seed');
const seedSpecialties = require('./specialty.seed');
const seedPrestadores = require('./prestador.seed');
const seedServicios = require('./servicio.seed');
const seedPrestadorServicios = require('./prestador_servicio.seed');
const seedPatients = require('./patient.seed');
const seedAppointments = require('./appointment.seed');

// Función para ejecutar los seeders en orden
const runSeeders = async () => {
  try {
    console.log('Iniciando la población de la base de datos con datos de prueba...');
    
    // Sincronizar la base de datos (opcional, solo para desarrollo)
    // En producción o entornos reales, esto podría ser peligroso
    if (process.env.NODE_ENV === 'development') {
      console.log('- Sincronizando la base de datos...');
      await db.sequelize.sync({ force: true });
      console.log('- Base de datos sincronizada correctamente');
    }
    
    // Ejecutar seeders en orden apropiado (para respetar las dependencias)
    console.log('- Creando usuarios...');
    await seedUsers();
    
    console.log('- Creando sectores...');
    await seedSectors();
    
    console.log('- Creando especialidades...');
    await seedSpecialties();
    
    console.log('- Creando prestadores...');
    await seedPrestadores();
    
    console.log('- Creando servicios...');
    await seedServicios();
    
    console.log('- Relacionando prestadores y servicios...');
    await seedPrestadorServicios();
    
    console.log('- Creando pacientes...');
    await seedPatients();
    
    console.log('- Creando citas...');
    await seedAppointments();
    
    console.log('- Creando horarios de prestadores...');
    await require('./prestador_horario.seed')();
    
    console.log('¡Base de datos poblada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('Error al poblar la base de datos:', error);
    process.exit(1);
  }
};

// Si este script se ejecuta directamente, ejecutar los seeders
if (require.main === module) {
  runSeeders();
}

module.exports = runSeeders;
