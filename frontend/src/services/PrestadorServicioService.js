import api from '../utils/api'; // Asegúrate de que la ruta a tu cliente de axios sea correcta

const API_URL = "/doctors/"; // Se cambió de "/prestadores/" a "/doctors/"

/**
 * Obtiene todos los servicios asignados a un prestador específico.
 * @param {number|string} id_prestador - El ID del prestador.
 * @returns {Promise} La respuesta de la API con la lista de servicios.
 */
const getServicios = (id_prestador) => {
  return api.get(`${API_URL}${id_prestador}/servicios`);
};

/**
 * Asigna uno o más servicios a un prestador.
 * @param {number|string} id_prestador - El ID del prestador.
 * @param {Array<number>} serviciosIds - Un array con los IDs de los servicios a agregar.
 * @returns {Promise} La respuesta de la API.
 */
const addServicios = (id_prestador, serviciosIds) => {
  return api.post(`${API_URL}${id_prestador}/servicios`, {
    servicios: serviciosIds
  });
};

/**
 * Elimina un servicio asignado a un prestador.
 * @param {number|string} id_prestador - El ID del prestador.
 * @param {number|string} id_servicio - El ID del servicio a eliminar.
 * @returns {Promise} La respuesta de la API.
 */
const removeServicio = (id_prestador, id_servicio) => {
  return api.delete(`${API_URL}${id_prestador}/servicios/${id_servicio}`);
};

const PrestadorServicioService = {
  getServicios,
  addServicios,
  removeServicio,
};

export default PrestadorServicioService;