import api from '../utils/api';

const SeguroService = {
  getAll: () => api.get('/seguros'),
  getById: (id) => api.get(`/seguros/${id}`),
  create: (data) => api.post('/seguros', data),
  update: (id, data) => api.put(`/seguros/${id}`, data),
  delete: (id) => api.delete(`/seguros/${id}`)
};

export default SeguroService;