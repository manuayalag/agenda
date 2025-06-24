import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContextValue';
import ServicioService from '../../services/ServicioService';
import PrestadorServicioService from '../../services/PrestadorServicioService';

const DoctorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isEditMode = !!id;
  
  const [doctor, setDoctor] = useState({
    name: '',
    email: '',
    phone: '',
    specialtyId: '',
    sectorId: '',
    userId: '',
    active: true,
    notes: ''
  });
  
  const [sectors, setSectors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [users, setUsers] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Cargar especialidades
        const specialtiesResponse = await api.get('/specialties');
        setSpecialties(specialtiesResponse.data);

        // Cargar sectores (si es admin general) o usar el sector del usuario (si es admin de sector)
        if (user.role === 'admin') {
          const sectorsResponse = await api.get('/sectors');
          setSectors(sectorsResponse.data);
        } else if (user.role === 'sector_admin' && user.sectorId) {
          const sectorResponse = await api.get(`/sectors/${user.sectorId}`);
          setSectors([sectorResponse.data]);
          // Pre-seleccionar el sector del admin
          setDoctor(prev => ({ ...prev, sectorId: user.sectorId }));
        }

        // Cargar usuarios con rol 'doctor' que no tienen asignado un doctor
        const usersResponse = await api.get('/users?role=doctor&unassigned=true');
        setUsers(usersResponse.data);

        // Cargar servicios
        const serviciosResponse = await ServicioService.getAll();
        setServicios(serviciosResponse.data);
        // Si es edición, cargar servicios asignados
        if (isEditMode) {
          const serviciosPrestador = await PrestadorServicioService.getServicios(id);
          setServiciosSeleccionados(serviciosPrestador.data.map(s => s.id_servicio));
        }
        
        if (isEditMode) {
          await fetchDoctorData();
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Error al cargar los datos iniciales');
      }
    };

    fetchInitialData();
  }, [id, isEditMode, user.role, user.sectorId]);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors/${id}`);
      setDoctor(response.data);
      
      // Si el doctor ya tiene un usuario asignado, cargarlo también
      if (response.data.userId) {
        const userResponse = await api.get(`/users/${response.data.userId}`);
        setUsers(prev => [userResponse.data, ...prev]);
      }
    } catch (err) {
      console.error('Error fetching doctor:', err);
      setError('Error al cargar los datos del doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDoctor({
      ...doctor,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleServiciosChange = (e) => {
    const value = parseInt(e.target.value);
    setServiciosSeleccionados(prev =>
      prev.includes(value)
        ? prev.filter(id => id !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let doctorId = id;
      if (isEditMode) {
        await api.put(`/doctors/${id}`, doctor);
      } else {
        const res = await api.post('/doctors', doctor);
        doctorId = res.data.id;
      }
      // Guardar servicios seleccionados
      await PrestadorServicioService.addServicios(doctorId, serviciosSeleccionados);
      setSuccess('Doctor y servicios guardados correctamente');
      setTimeout(() => {
        navigate('/doctors');
      }, 2000);
    } catch (err) {
      console.error('Error saving doctor:', err);
      setError(err.response?.data?.message || 'Error al guardar el doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h2>{isEditMode ? 'Editar Doctor' : 'Nuevo Doctor'}</h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre Completo</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={doctor.name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={doctor.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={doctor.phone || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Usuario del Sistema</Form.Label>
                  <Form.Select
                    name="userId"
                    value={doctor.userId || ''}
                    onChange={handleChange}
                  >
                    <option value="">Sin usuario asignado</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.email})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Especialidad</Form.Label>
                  <Form.Select
                    name="specialtyId"
                    value={doctor.specialtyId || ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione una especialidad</option>
                    {specialties.map(specialty => (
                      <option key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sector</Form.Label>
                  <Form.Select
                    name="sectorId"
                    value={doctor.sectorId || ''}
                    onChange={handleChange}
                    disabled={user.role === 'sector_admin'}
                    required
                  >
                    <option value="">Seleccione un sector</option>
                    {sectors.map(sector => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notas</Form.Label>
              <Form.Control
                as="textarea"
                name="notes"
                value={doctor.notes || ''}
                onChange={handleChange}
                rows={3}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Doctor Activo"
                name="active"
                checked={doctor.active}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Servicios que presta</Form.Label>
              <div>
                {servicios.map(servicio => (
                  <Form.Check
                    key={servicio.id_servicio}
                    type="checkbox"
                    label={`${servicio.nombre_servicio} ($${servicio.precio}, ${servicio.tiempo} min)`}
                    value={servicio.id_servicio}
                    checked={serviciosSeleccionados.includes(servicio.id_servicio)}
                    onChange={handleServiciosChange}
                  />
                ))}
              </div>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/doctors')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DoctorForm;
