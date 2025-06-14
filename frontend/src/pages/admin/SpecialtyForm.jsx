import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import api from '../../utils/api';

const SpecialtyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [specialty, setSpecialty] = useState({
    name: '',
    description: '',
    active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchSpecialtyData();
    }
  }, [id, isEditMode]);

  const fetchSpecialtyData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/specialties/${id}`);
      setSpecialty(response.data);
    } catch (err) {
      console.error('Error fetching specialty:', err);
      setError('Error al cargar los datos de la especialidad');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSpecialty({
      ...specialty,
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
        await api.put(`/specialties/${id}`, specialty);
        setSuccess('Especialidad actualizada correctamente');
      } else {
        await api.post('/specialties', specialty);
        setSuccess('Especialidad creada correctamente');
        setSpecialty({
          name: '',
          description: '',
          active: true
        });
      }
      
      // Redirigir después de un breve retraso
      setTimeout(() => {
        navigate('/admin/specialties');
      }, 2000);
    } catch (err) {
      console.error('Error saving specialty:', err);
      setError(err.response?.data?.message || 'Error al guardar la especialidad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h2>{isEditMode ? 'Editar Especialidad' : 'Nueva Especialidad'}</h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre de la Especialidad</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={specialty.name}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={specialty.description || ''}
                onChange={handleChange}
                rows={3}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Especialidad Activa"
                name="active"
                checked={specialty.active}
                onChange={handleChange}
              />
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/admin/specialties')}
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

export default SpecialtyForm;
