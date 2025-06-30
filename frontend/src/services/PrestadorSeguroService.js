import api from '../utils/api';

const PrestadorSeguroService = {
  getSegurosByPrestador: (id_prestador) => api.get(`/prestadores/${id_prestador}/seguros`),
  addSeguro: (id_prestador, id_seguro) => api.post(`/prestadores/${id_prestador}/seguros`, { id_seguro }),
  removeSeguro: (id_prestador, id_seguro) => api.delete(`/prestadores/${id_prestador}/seguros/${id_seguro}`)
};

export default PrestadorSeguroService;