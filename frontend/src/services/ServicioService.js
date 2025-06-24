import api from '../utils/api';

const ServicioService = {
  getAll: () => api.get('/servicios'),
  getById: (id) => api.get(`/servicios/${id}`),
};

export default ServicioService;
