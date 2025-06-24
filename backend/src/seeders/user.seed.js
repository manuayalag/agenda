const db = require('../models');
const bcrypt = require('bcryptjs');
const User = db.User;

/**
 * Seeder para la creación de usuarios iniciales de prueba
 */
const seedUsers = async () => {
  try {
    const existingUsers = await User.count();
    if (existingUsers > 0) {
      console.log('Usuarios ya existen, se omite creación.');
      return true;
    }

    // Admin principal del sistema
    await User.create({
      username: 'admin',
      email: 'admin@clinica.com',
      password: bcrypt.hashSync('admin123', 8),
      fullName: 'Administrador Principal',
      role: 'admin',
      active: true,
      lastLogin: new Date()
    });

    // Administradores de sector (se asignarán a sectores específicos después)
    const sectorAdmins = [
      {
        username: 'adminconsultas',
        email: 'consultas@clinica.com',
        password: bcrypt.hashSync('sector123', 8),
        fullName: 'Administrador Consultas Externas',
        role: 'sector_admin',
        active: true
      },
      {
        username: 'adminemergencia',
        email: 'emergencia@clinica.com',
        password: bcrypt.hashSync('sector123', 8),
        fullName: 'Administrador Emergencias',
        role: 'sector_admin',
        active: true
      },
      {
        username: 'admincirugias',
        email: 'cirugias@clinica.com',
        password: bcrypt.hashSync('sector123', 8),
        fullName: 'Administrador Cirugías',
        role: 'sector_admin',
        active: true
      }
    ];

    await User.bulkCreate(sectorAdmins);

    // Doctores (primero se crean los usuarios)
    const doctorUsers = [
      {
        username: 'drcardenas',
        email: 'cardenas@clinica.com',
        password: bcrypt.hashSync('doctor123', 8),
        fullName: 'Dr. Roberto Cárdenas',
        role: 'doctor',
        active: true
      },
      {
        username: 'dralopez',
        email: 'lopez@clinica.com',
        password: bcrypt.hashSync('doctor123', 8),
        fullName: 'Dra. María López',
        role: 'doctor',
        active: true
      },
      {
        username: 'drvasquez',
        email: 'vasquez@clinica.com',
        password: bcrypt.hashSync('doctor123', 8),
        fullName: 'Dr. Carlos Vásquez',
        role: 'doctor',
        active: true
      },
      {
        username: 'drgomez',
        email: 'gomez@clinica.com',
        password: bcrypt.hashSync('doctor123', 8),
        fullName: 'Dr. Juan Gómez',
        role: 'doctor',
        active: true
      },
      {
        username: 'draortiz',
        email: 'ortiz@clinica.com',
        password: bcrypt.hashSync('doctor123', 8),
        fullName: 'Dra. Ana Ortiz',
        role: 'doctor',
        active: true
      }
    ];

    await User.bulkCreate(doctorUsers);

    console.log('✅ Usuarios creados exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
    throw error;
  }
};

module.exports = seedUsers;
