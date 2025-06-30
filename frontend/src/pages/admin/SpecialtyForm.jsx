// frontend/src/pages/admin/specialties/SpecialtyForm.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import api from '../../utils/api';
import styles from './Specialties.module.css';

const SpecialtyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [specialty, setSpecialty] = useState({ name: '', description: '', active: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEditMode) {
      api.get(`/specialties/${id}`).then(res => setSpecialty(res.data)).catch(() => setError('Error al cargar datos.'));
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSpecialty(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isEditMode) {
        await api.put(`/specialties/${id}`, specialty);
        setSuccess('Especialidad actualizada exitosamente.');
      } else {
        await api.post('/specialties', specialty);
        setSuccess('Especialidad creada exitosamente.');
      }
      setTimeout(() => navigate('/admin/specialties'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la especialidad.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card className={styles.specialtyCard}>
        <Card.Header className={styles.cardHeader}><h2>{isEditMode ? 'Editar Especialidad' : 'Nueva Especialidad'}</h2></Card.Header>
        <Card.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className={styles.formLabel}>Nombre de la Especialidad</Form.Label>
              <Form.Control type="text" name="name" value={specialty.name} onChange={handleChange} required className={styles.formControl} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className={styles.formLabel}>Descripción</Form.Label>
              <Form.Control as="textarea" name="description" value={specialty.description || ''} onChange={handleChange} rows={3} className={styles.formControl} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Check type="switch" label="Especialidad Activa" name="active" checked={specialty.active} onChange={handleChange} />
            </Form.Group>
            <div className={styles.buttonGroup}>
              <Button variant="light" onClick={() => navigate('/admin/specialties')} disabled={loading}>Cancelar</Button>
              <Button type="submit" className={styles.primaryButton} disabled={loading}>{loading ? <Spinner size="sm" /> : 'Guardar'}</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SpecialtyForm;