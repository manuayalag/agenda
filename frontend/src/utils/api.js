import axios from 'axios';

const API_URL = 'http://85.31.60.190:5000/api';

// Agregar interceptor para incluir el token en cada solicitud
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Agregar interceptor para incluir el token en las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-access-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      window.location.pathname !== '/login'
    ) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    // Si ya estás en /login, solo rechaza el error y deja que el componente maneje el mensaje
    return Promise.reject(error);
  }
);

// Exportar la instancia de api como default
export default api;

// Servicio de Autenticación
export const AuthService = {
  login: (username, password) => {
    return api.post('/auth/signin', { username, password });
  },
  register: (userData) => {
    return api.post('/auth/signup', userData);
  }
};

// Servicio de Usuarios
export const UserService = {
  getAll: () => {
    return api.get('/users');
  },
  getById: (id) => {
    return api.get(`/users/${id}`);
  },
  update: (id, userData) => {
    return api.put(`/users/${id}`, userData);
  },
  delete: (id) => {
    return api.delete(`/users/${id}`);
  }
};

// --- Servicio de Doctores (MODIFICADO) ---
export const DoctorService = {
  getAll: () => {
    return api.get('/doctors');
  },
  getBySector: (sectorId) => {
    return api.get(`/doctors/sector/${sectorId}`);
  },
  getById: (id) => {
    return api.get(`/doctors/${id}`);
  },
  update: (id, doctorData) => {
    return api.put(`/doctors/${id}`, doctorData);
  },
  
  // --- FUNCIÓN MODIFICADA ---
  // Llama al endpoint que devuelve los bloques de trabajo y citas de un día.
  // Reemplaza la antigua getAvailability.
  getDailyAvailability: (id, date) => {
    return api.get(`/doctors/${id}/availability/${date}`);
  },

  // --- FUNCIÓN AÑADIDA ---
  // Llama al nuevo endpoint para obtener la disponibilidad de todo un mes.
  getMonthlyAvailability: (id, year, month) => {
    return api.get(`/doctors/${id}/monthly-availability`, { params: { year, month } });
  }
};

// Servicio de Citas
export const AppointmentService = {
  getAll: () => {
    return api.get('/appointments');
  },
  getFiltered: (params) => {
    return api.get('/appointments/filtered', { params });
  },
  getDoctorAppointments: (prestadorId, params) => {
    return api.get(`/appointments/doctor/${prestadorId}`, { params });
  },
  getById: (id) => {
    return api.get(`/appointments/${id}`);
  },
  create: (appointmentData) => {
    return api.post('/appointments', appointmentData);
  },
  update: (id, appointmentData) => {
    return api.put(`/appointments/${id}`, appointmentData);
  },
  delete: (id) => {
    return api.delete(`/appointments/${id}`);
  }
};

// Servicio de Pacientes
export const PatientService = {
  getAll: () => {
    return api.get('/patients');
  },
  search: (term) => {
    return api.get(`/patients/search?term=${term}`);
  },
  getById: (id) => {
    return api.get(`/patients/${id}`);
  },
  create: (patientData) => {
    return api.post('/patients', patientData);
  },
  update: (id, patientData) => {
    return api.put(`/patients/${id}`, patientData);
  },
  delete: (id) => {
    return api.delete(`/patients/${id}`);
  }
};

// Servicio de Sectores
export const SectorService = {
  getAll: () => {
    return api.get('/sectors');
  },
  getById: (id) => {
    return api.get(`/sectors/${id}`);
  },
  create: (sectorData) => {
    return api.post('/sectors', sectorData);
  },
  update: (id, sectorData) => {
    return api.put(`/sectors/${id}`, sectorData);
  },
  delete: (id) => {
    return api.delete(`/sectors/${id}`);
  }
};

// Servicio de Especialidades
export const SpecialtyService = {
  getAll: () => {
    return api.get('/specialties');
  },
  getById: (id) => {
    return api.get(`/specialties/${id}`);
  },
  create: (specialtyData) => {
    return api.post('/specialties', specialtyData);
  },
  update: (id, specialtyData) => {
    return api.put(`/specialties/${id}`, specialtyData);
  },
  delete: (id) => {
    return api.delete(`/specialties/${id}`);
  }
};