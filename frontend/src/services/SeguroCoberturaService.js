import api from '../utils/api';

const SeguroCoberturaService = {
  getServicios: (id_seguro) => api.get(`/seguros/${id_seguro}/servicios`),
  addServicio: (id_seguro, data) => api.post(`/seguros/${id_seguro}/servicios`, data),
  updateServicio: (id_seguro, id_servicio, data) => api.put(`/seguros/${id_seguro}/servicios/${id_servicio}`, data),
  removeServicio: (id_seguro, id_servicio) => api.delete(`/seguros/${id_seguro}/servicios/${id_servicio}`)
};

export default SeguroCoberturaService;