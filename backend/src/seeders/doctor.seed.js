const db = require('../models');
const Doctor = db.Doctor;
const User = db.User;
const Specialty = db.Specialty;
const Sector = db.Sector;

/**
 * Seeder para la creación de doctores
 */
const seedDoctors = async () => {
  try {
    // Obtener las referencias necesarias
    const users = await User.findAll({ where: { role: 'doctor' } });
    const specialties = await Specialty.findAll();
    const sectors = await Sector.findAll();

    // Verificar que tenemos todos los datos necesarios
    if (users.length === 0 || specialties.length === 0 || sectors.length === 0) {
      throw new Error('Faltan datos necesarios para crear doctores (usuarios, especialidades o sectores)');
    }

    // Crear datos de doctores mapeados a los usuarios existentes
    const doctorsData = [
      {
        userId: users.find(u => u.username === 'drcardenas').id,
        specialtyId: specialties.find(s => s.name === 'Cardiología').id,
        sectorId: sectors.find(s => s.name === 'Consultas Externas').id,
        licenseNumber: 'CAR-12345',
        workingDays: [1, 2, 3, 4, 5], // Lunes a Viernes
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
        workingDays: [1, 3, 5], // Lunes, Miércoles, Viernes
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
        workingDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
        workingHourStart: '07:00:00',
        workingHourEnd: '15:00:00',
        appointmentDuration: 30,
        active: true
      },
      {
        userId: users.find(u => u.username === 'drgomez').id,
        specialtyId: specialties.find(s => s.name === 'Medicina General').id,
        sectorId: sectors.find(s => s.name === 'Consultas Externas').id,
        licenseNumber: 'MG-24680',
        workingDays: [2, 4, 6], // Martes, Jueves, Sábado
        workingHourStart: '10:00:00',
        workingHourEnd: '18:00:00',
        appointmentDuration: 20,
        active: true
      },
      {
        userId: users.find(u => u.username === 'draortiz').id,
        specialtyId: specialties.find(s => s.name === 'Ginecología').id,
        sectorId: sectors.find(s => s.name === 'Consultas Externas').id,
        licenseNumber: 'GIN-13579',
        workingDays: [1, 2, 3, 4, 5], // Lunes a Viernes
        workingHourStart: '08:30:00',
        workingHourEnd: '16:30:00',
        appointmentDuration: 40,
        active: true
      }
    ];

    await Doctor.bulkCreate(doctorsData);

    // Actualizar sectorId en los usuarios doctores
    for (const doctorData of doctorsData) {
      const user = await User.findByPk(doctorData.userId);
      await user.update({ sectorId: doctorData.sectorId });
    }

    console.log('✅ Doctores creados exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al crear doctores:', error);
    throw error;
  }
};

module.exports = seedDoctors;
