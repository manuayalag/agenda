const db = require('../models');
const Sector = db.Sector;
const User = db.User;

/**
 * Seeder para la creación de sectores iniciales
 */
const seedSectors = async () => {
  try {
    // Obtener los IDs de los usuarios admin de sector
    const consultasAdmin = await User.findOne({ where: { username: 'adminconsultas' } });
    const emergenciaAdmin = await User.findOne({ where: { username: 'adminemergencia' } });
    const cirugiasAdmin = await User.findOne({ where: { username: 'admincirugias' } });

    const sectors = [
      {
        name: 'Consultas Externas',
        description: 'Sector para atención de consultas programadas',
        adminId: consultasAdmin ? consultasAdmin.id : null,
        active: true
      },
      {
        name: 'Emergencias',
        description: 'Sector para atención de emergencias y urgencias médicas',
        adminId: emergenciaAdmin ? emergenciaAdmin.id : null,
        active: true
      },
      {
        name: 'Cirugías',
        description: 'Sector para procedimientos quirúrgicos programados',
        adminId: cirugiasAdmin ? cirugiasAdmin.id : null,
        active: true
      },
      {
        name: 'Laboratorio',
        description: 'Sector para análisis clínicos y pruebas diagnósticas',
        active: true
      },
      {
        name: 'Radiología',
        description: 'Sector para estudios de imagen y radiografías',
        active: true
      }
    ];

    // Crear sectores
    await Sector.bulkCreate(sectors);

    // Actualizar usuarios con sus sectores asignados
    if (consultasAdmin) {
      const consultasSector = await Sector.findOne({ where: { name: 'Consultas Externas' } });
      await consultasAdmin.update({ sectorId: consultasSector.id });
    }

    if (emergenciaAdmin) {
      const emergenciaSector = await Sector.findOne({ where: { name: 'Emergencias' } });
      await emergenciaAdmin.update({ sectorId: emergenciaSector.id });
    }

    if (cirugiasAdmin) {
      const cirugiasSector = await Sector.findOne({ where: { name: 'Cirugías' } });
      await cirugiasAdmin.update({ sectorId: cirugiasSector.id });
    }

    console.log('✅ Sectores creados exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al crear sectores:', error);
    throw error;
  }
};

module.exports = seedSectors;
