const db = require('../models');
const Prestador = db.Prestador;
const Servicio = db.Servicio;

/**
 * Seeder para la relación muchos-a-muchos entre prestadores y servicios
 */
const seedPrestadorServicios = async () => {
  try {
    const prestadores = await Prestador.findAll();
    const servicios = await Servicio.findAll();

    if (prestadores.length === 0 || servicios.length === 0) {
      throw new Error('Faltan prestadores o servicios para asignar.');
    }

    // Asignar todos los servicios a todos los prestadores (puedes personalizar esta lógica)
    for (const prestador of prestadores) {
      await prestador.setServicios(servicios);
    }
    console.log('Relaciones prestador-servicio creadas correctamente');
  } catch (error) {
    console.error('Error al crear relaciones prestador-servicio:', error);
  }
};

module.exports = seedPrestadorServicios;
