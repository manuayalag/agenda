const db = require('../models');
const Servicio = db.Servicio;

/**
 * Seeder para la creación de servicios médicos
 */
const seedServicios = async () => {
  try {
    const servicios = [
      { nombre_servicio: 'Consulta General', precio: 100, tiempo: 20, activo: true },
      { nombre_servicio: 'Electrocardiograma', precio: 200, tiempo: 30, activo: true },
      { nombre_servicio: 'Consulta Pediátrica', precio: 120, tiempo: 30, activo: true },
      { nombre_servicio: 'Consulta Traumatológica', precio: 150, tiempo: 30, activo: true },
      { nombre_servicio: 'Control de Presión', precio: 80, tiempo: 15, activo: true }
    ];
    await Servicio.bulkCreate(servicios);
    console.log('Servicios creados correctamente');
  } catch (error) {
    console.error('Error al crear servicios:', error);
  }
};

module.exports = seedServicios;
