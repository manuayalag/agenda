import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import Select from 'react-select';
// --- CORRECCIÓN FINAL Y DEFINITIVA DE LA RUTA ---
import api from '../../utils/api';
import styles from './Sectors.module.css'; // Asumiendo que el CSS está en la misma carpeta

const SectorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [sector, setSector] = useState({ name: '', description: '', adminId: null, active: true });
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchFormData = async () => {
      setPageLoading(true);
      try {
        const adminsRes = await api.get('/users?role=sector_admin&size=1000');
        setAdmins(adminsRes.data.items || []);

        if (isEditMode) {
          const sectorRes = await api.get(`/sectors/${id}`);
          setSector(sectorRes.data);
        }
      } catch (err) {
        setError('Error al cargar los datos necesarios para el formulario.');
      } finally {
        setPageLoading(false);
      }
    };
    fetchFormData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSector(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAdminChange = (selectedOption) => {
    setSector(prev => ({ ...prev, adminId: selectedOption ? selectedOption.value : null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isEditMode) {
        await api.put(`/sectors/${id}`, sector);
        setSuccess('Sector actualizado exitosamente.');
      } else {
        await api.post('/sectors', sector);
        setSuccess('Sector creado exitosamente.');
      }
      setTimeout(() => navigate('/admin/sectors'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el sector.');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}><Spinner animation="border" /></Container>;
  }

  const adminOptions = admins.map(admin => ({ value: admin.id, label: `${admin.fullName} (${admin.email})` }));
  const selectedAdmin = adminOptions.find(option => option.value === sector.adminId) || null;

  return (
    <Container className="py-4">
      <Card className={styles.sectorCard}>
        <Card.Header className={styles.cardHeader}>
          <h2>{isEditMode ? 'Editar Sector' : 'Nuevo Sector'}</h2>
        </Card.Header>
        <Card.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className={styles.formLabel}>Nombre del Sector</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={sector.name}
                onChange={handleChange}
                required
                className={styles.formControl}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className={styles.formLabel}>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={sector.description || ''}
                onChange={handleChange}
                rows={3}
                className={styles.formControl}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className={styles.formLabel}>Administrador del Sector</Form.Label>
              <Select
                options={adminOptions}
                value={selectedAdmin}
                onChange={handleAdminChange}
                isClearable
                placeholder="Sin administrador asignado..."
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Check
                type="switch"
                label="Sector Activo"
                name="active"
                checked={sector.active}
                onChange={handleChange}
              />
            </Form.Group>
            <div className={styles.buttonGroup}>
              <Button variant="light" onClick={() => navigate('/admin/sectors')} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" className={styles.primaryButton} disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Guardar'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SectorForm;