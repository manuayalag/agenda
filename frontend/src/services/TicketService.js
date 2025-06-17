import api from '../utils/api';

const TicketService = {
  getAll: () => api.get('/tickets'),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  remove: (id) => api.delete(`/tickets/${id}`),
};

export default TicketService;
