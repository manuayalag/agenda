const db = require('../models');
const Prestador = db.Prestador;
const User = db.User;
const Specialty = db.Specialty;
const Sector = db.Sector;

/**
 * Seeder para la creación de prestadores
 */
const seedPrestadores = async () => {
  try {
    // Obtener las referencias necesarias
    const users = await User.findAll({ where: { role: 'doctor' } });
    const specialties = await Specialty.findAll();
    const sectors = await Sector.findAll();

    if (users.length === 0 || specialties.length === 0 || sectors.length === 0) {
      throw new Error('Faltan datos necesarios para crear prestadores (usuarios, especialidades o sectores)');
    }

    const prestadoresData = [
      {
        userId: users.find(u => u.username === 'drcardenas').id,
        specialtyId: specialties.find(s => s.name === 'Cardiología').id,
        sectorId: sectors.find(s => s.name === 'Consultas Externas').id,
        licenseNumber: 'CAR-12345',
        workingDays: [1, 2, 3, 4, 5],
        workingHourStart: '08:00:00',
        workingHourEnd: '16:00:00',
        appointmentDuration: 30,
        active: true
      },
      {
        userId: users.find(u => u.username === 'dralopez').id,
        specialtyId: specialties.find(s => s.name === 'Pediatría').id,
        sectorId: sectors.find(s => s.name === 'Consultas Externas').id,
        licenseNumber: 'PED-54321',
        workingDays: [1, 3, 5],
        workingHourStart: '09:00:00',
        workingHourEnd: '17:00:00',
        appointmentDuration: 45,
        active: true
      },
      {
        userId: users.find(u => u.username === 'drvasquez').id,
        specialtyId: specialties.find(s => s.name === 'Traumatología').id,
        sectorId: sectors.find(s => s.name === 'Emergencias').id,
        licenseNumber: 'TRA-67890',
        workingDays: [1, 2, 3, 4, 5, 6],
        workingHourStart: '07:00:00',
        workingHourEnd: '15:00:00',
        appointmentDuration: 30,
        active: true
      },
      {
        userId: users.find(u => u.username === 'drgomez').id,
        specialtyId: specialties.find(s => s.name === 'Medicina General').id,
        sectorId: sectors.find(s => s.name === 'Consultas Externas').id,
        licenseNumber: 'GEN-11111',
        workingDays: [2, 4],
        workingHourStart: '10:00:00',
        workingHourEnd: '14:00:00',
        appointmentDuration: 20,
        active: true
      }
    ];

    await Prestador.bulkCreate(prestadoresData);
    console.log('Prestadores creados correctamente');
  } catch (error) {
    console.error('Error al crear prestadores:', error);
  }
};

module.exports = seedPrestadores;
