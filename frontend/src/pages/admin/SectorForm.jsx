import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import api from '../../utils/api';

const SectorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [sector, setSector] = useState({
    name: '',
    description: '',
    adminId: '',
    active: true
  });
  
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => {    
    const fetchAdmins = async () => {
      try {
        // Obtener usuarios que pueden ser administradores de sector (role: sector_admin)
        const response = await api.get('/users?role=sector_admin');
        // Si la API no procesa el query param, filtramos aquí
        const sectorAdmins = Array.isArray(response.data) ? 
          response.data.filter(user => user.role === 'sector_admin') : 
          response.data;
        setAdmins(sectorAdmins);
      } catch (err) {
        console.error('Error fetching admins:', err);
        setError('Error al cargar los administradores de sector');
      }
    };

    fetchAdmins();

    if (isEditMode) {
      fetchSectorData();
    }
  }, [id, isEditMode]);

  const fetchSectorData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sectors/${id}`);
      setSector(response.data);
    } catch (err) {
      console.error('Error fetching sector:', err);
      setError('Error al cargar los datos del sector');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSector({
      ...sector,
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
        await api.put(`/sectors/${id}`, sector);
        setSuccess('Sector actualizado correctamente');
      } else {
        await api.post('/sectors', sector);
        setSuccess('Sector creado correctamente');
        setSector({
          name: '',
          description: '',
          adminId: '',
          active: true
        });
      }
      
      // Redirigir después de un breve retraso
      setTimeout(() => {
        navigate('/admin/sectors');
      }, 2000);
    } catch (err) {
      console.error('Error saving sector:', err);
      setError(err.response?.data?.message || 'Error al guardar el sector');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h2>{isEditMode ? 'Editar Sector' : 'Nuevo Sector'}</h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre del Sector</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={sector.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={sector.description || ''}
                onChange={handleChange}
                rows={3}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Administrador del Sector</Form.Label>
              <Form.Select
                name="adminId"
                value={sector.adminId || ''}
                onChange={handleChange}
              >
                <option value="">Sin administrador asignado</option>
                {admins.map(admin => (
                  <option key={admin.id} value={admin.id}>
                    {admin.fullName} ({admin.email})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Sector Activo"
                name="active"
                checked={sector.active}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin/sectors')}
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

export default SectorForm;
