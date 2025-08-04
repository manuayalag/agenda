const db = require('../models');
const PrestadorServicio = db.PrestadorServicio;

// --- OBTENER SERVICIOS DE UN PRESTADOR (CORREGIDO) ---
exports.getServiciosByPrestador = async (req, res) => {
  const { id_prestador } = req.params;
  console.log(`[LOG] Solicitud para OBTENER servicios del prestador ID: ${id_prestador}`);
  try {
    // Buscamos el prestador por su ID e incluimos sus servicios asociados
    const prestador = await db.Prestador.findByPk(id_prestador, {
      include: [{
        model: db.Servicio,
        as: 'servicios', // Este alias viene de la definición en models/index.js
        through: { attributes: [] } // Esto evita que se incluyan los datos de la tabla intermedia
      }]
    });

    if (!prestador) {
      console.log(`[LOG] Prestador con ID ${id_prestador} no encontrado.`);
      return res.status(404).json({ message: "Prestador no encontrado." });
    }

    // El frontend espera un array de servicios, así que devolvemos prestador.servicios
    console.log(`[LOG] Se encontraron ${prestador.servicios.length} servicios asignados.`);
    res.status(200).json(prestador.servicios);

  } catch (error) {
    console.error('[ERROR] al obtener servicios:', error);
    res.status(500).send({ message: "Error al obtener los servicios del prestador." });
  }
};

// --- AGREGAR SERVICIOS A UN PRESTADOR (SIN CAMBIOS) ---
exports.addServiciosToPrestador = async (req, res) => {
  const { id_prestador } = req.params;
  const { servicios } = req.body;

  console.log(`\n\n------------------------------------------------------`);
  console.log(`[LOG] INICIO DE AGREGAR SERVICIO`);
  console.log(`[LOG] Ruta: POST /doctors/${id_prestador}/servicios`);
  console.log(`[LOG] Datos Recibidos (req.body):`, req.body);
  console.log(`------------------------------------------------------`);

  if (!servicios || !Array.isArray(servicios) || servicios.length === 0) {
    console.error('[ERROR] El formato de los datos es incorrecto. Se esperaba un objeto con la clave "servicios" que contenga un array.');
    return res.status(400).send({ message: "Formato de datos inválido. Se requiere un array 'servicios'." });
  }

  try {
    const relaciones = servicios.map(id_servicio => ({
      id_prestador: parseInt(id_prestador, 10),
      id_servicio: parseInt(id_servicio, 10)
    }));

    console.log('[LOG] Preparando para guardar las siguientes relaciones:', relaciones);
    
    const result = await PrestadorServicio.bulkCreate(relaciones, { ignoreDuplicates: true });

    console.log('[LOG] La operación en la base de datos se completó. Resultado:', result);
    
    res.status(201).send({ message: "Servicios agregados correctamente.", data: result });

  } catch (error) {
    console.error("--- ¡ERROR FATAL DURANTE LA OPERACIÓN DE GUARDADO! ---");
    console.error(error);
    console.error("-----------------------------------------------------");
    res.status(500).send({ message: "Error interno del servidor.", detalle: error.message });
  }
};

// --- QUITAR UN SERVICIO DE UN PRESTADOR (SIN CAMBIOS) ---
exports.removeServicioFromPrestador = async (req, res) => {
  const { id_prestador, id_servicio } = req.params;
  console.log(`\n\n[LOG] INICIO DE QUITAR SERVICIO: Prestador=${id_prestador}, Servicio=${id_servicio}`);
  try {
    const result = await PrestadorServicio.destroy({
      where: {
        id_prestador: parseInt(id_prestador, 10),
        id_servicio: parseInt(id_servicio, 10)
      }
    });

    console.log(`[LOG] La base de datos respondió. Filas eliminadas: ${result}`);
    
    if (result === 0) {
      return res.status(404).send({ message: "La relación prestador-servicio no fue encontrada." });
    }
    
    res.status(200).send({ message: "Servicio desasignado con éxito." });
  } catch (error) {
    console.error("--- ¡ERROR FATAL AL QUITAR SERVICIO! ---", error);
    res.status(500).send({ message: "Error interno del servidor.", detalle: error.message });
  }
};