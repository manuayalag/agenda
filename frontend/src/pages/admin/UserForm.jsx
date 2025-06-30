import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import api from '../../utils/api';
import styles from './Users.module.css';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [user, setUser] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'doctor',
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
        // --- CORRECCIÓN APLICADA AQUÍ ---
        // Se pide la lista completa de sectores y se extrae el array 'items' de la respuesta.
        const response = await api.get('/sectors?size=1000'); // Pedimos un número alto para obtener todos
        setSectors(response.data.items || []);
        // --- FIN DE LA CORRECCIÓN ---
      } catch (err) {
        setError('Error al cargar los sectores');
      }
    };

    fetchSectors();

    if (isEditMode) {
      api.get(`/users/${id}`).then(res => {
        const { password, ...userData } = res.data;
        setUser(userData);
      }).catch(err => setError('Error al cargar datos del usuario'));
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUser(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const userData = { ...user };
    if (isEditMode && !userData.password) {
      delete userData.password;
    }

    try {
      if (isEditMode) {
        await api.put(`/users/${id}`, userData);
        setSuccess('Usuario actualizado correctamente');
      } else {
        await api.post('/users', userData);
        setSuccess('Usuario creado correctamente');
      }
      setTimeout(() => navigate('/admin/users'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card className={styles.userCard}>
        <Card.Header className={styles.cardHeader}>
          <h2>{isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
        </Card.Header>
        <Card.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Nombre Completo</Form.Label><Form.Control type="text" name="fullName" value={user.fullName} onChange={handleChange} required className={styles.formControl} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Nombre de Usuario</Form.Label><Form.Control type="text" name="username" value={user.username} onChange={handleChange} required className={styles.formControl} /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Email</Form.Label><Form.Control type="email" name="email" value={user.email} onChange={handleChange} required className={styles.formControl} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>{isEditMode ? 'Nueva Contraseña' : 'Contraseña'}</Form.Label><Form.Control type="password" name="password" value={user.password || ''} onChange={handleChange} required={!isEditMode} placeholder={isEditMode ? 'Dejar en blanco para no cambiar' : ''} className={styles.formControl} /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Rol</Form.Label><Form.Select name="role" value={user.role} onChange={handleChange} className={styles.formSelect}><option value="admin">Administrador</option><option value="sector_admin">Admin de Sector</option><option value="doctor">Doctor</option></Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Sector</Form.Label><Form.Select name="sectorId" value={user.sectorId || ''} onChange={handleChange} disabled={user.role === 'admin'} required={user.role !== 'admin'} className={styles.formSelect}><option value="">Seleccione un sector...</option>{sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Form.Select></Form.Group></Col>
            </Row>
            <Form.Group className="mb-4"><Form.Check type="switch" label="Usuario Activo" name="active" checked={user.active} onChange={handleChange} /></Form.Group>
            <div className={styles.buttonGroup}>
              <Button variant="light" onClick={() => navigate('/admin/users')} disabled={loading}>Cancelar</Button>
              <Button type="submit" className={styles.primaryButton} disabled={loading}>{loading ? <Spinner as="span" size="sm" /> : 'Guardar'}</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UserForm;