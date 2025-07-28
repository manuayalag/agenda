import api from '../utils/api'; 

class ServicioService {
  getAll(page = 1, size = 10, search = "") {
    // Usamos URLSearchParams para añadir los parámetros a la URL de forma segura.
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);

    // Solo añadimos el parámetro 'search' si tiene contenido.
    if (search) {
      params.append('search', search);
    }
    
    // La petición final se verá así: /servicios?page=2&size=10&search=consulta
    return api.get('/servicios', { params });
  }

  create(data) {
    return api.post('/servicios', data);
  }

  update(id, data) {
    return api.put(`/servicios/${id}`, data);
  }

  delete(id) {
    return api.delete(`/servicios/${id}`);
  }
}

export default new ServicioService();