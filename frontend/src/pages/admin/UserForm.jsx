import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import api from '../../utils/api';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [user, setUser] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'sector_admin',
    sectorId: '',
    active: true
  });
  
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const response = await api.get('/sectors');
        setSectors(response.data);
      } catch (err) {
        console.error('Error fetching sectors:', err);
        setError('Error al cargar los sectores');
      }
    };

    fetchSectors();

    if (isEditMode) {
      fetchUserData();
    }
  }, [id, isEditMode]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${id}`);
      const userData = response.data;
      
      // Eliminar la contraseña por seguridad
      delete userData.password;
      
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUser({
      ...user,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isEditMode) {
        // Si estamos editando y el campo de contraseña está vacío, lo eliminamos para no actualizarlo
        const updateData = { ...user };
        if (!updateData.password) delete updateData.password;
        
        await api.put(`/users/${id}`, updateData);
        setSuccess('Usuario actualizado correctamente');
      } else {
        await api.post('/users', user);
        setSuccess('Usuario creado correctamente');
        setUser({
          username: '',
          email: '',
          password: '',
          fullName: '',
          role: 'sector_admin',
          sectorId: '',
          active: true
        });
      }
      
      // Redirigir después de un breve retraso
      setTimeout(() => {
        navigate('/admin/users');
      }, 2000);
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h2>{isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
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
                    name="fullName"
                    value={user.fullName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de Usuario</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={user.username}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={user.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{isEditMode ? 'Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={user.password}
                    onChange={handleChange}
                    required={!isEditMode}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rol</Form.Label>
                  <Form.Select
                    name="role"
                    value={user.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="admin">Administrador</option>
                    <option value="sector_admin">Administrador de Sector</option>
                    <option value="doctor">Doctor</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sector</Form.Label>
                  <Form.Select
                    name="sectorId"
                    value={user.sectorId || ''}
                    onChange={handleChange}
                    disabled={user.role === 'admin'}
                    required={user.role !== 'admin'}
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
              <Form.Check
                type="checkbox"
                label="Usuario Activo"
                name="active"
                checked={user.active}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin/users')}
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

export default UserForm;
