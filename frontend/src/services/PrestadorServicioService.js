import api from '../utils/api';

const PrestadorServicioService = {
  addServicios: (prestadorId, servicios) => api.post(`/prestadores/${prestadorId}/servicios`, { servicios }),
  getServicios: (prestadorId) => api.get(`/prestadores/${prestadorId}/servicios`),
};

export default PrestadorServicioService;
