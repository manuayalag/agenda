import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner, Table } from 'react-bootstrap';
import Select from 'react-select';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContextValue';
import ServicioService from '../../services/ServicioService';
import PrestadorServicioService from '../../services/PrestadorServicioService';
import PrestadorSeguroService from '../../services/PrestadorSeguroService';
import SeguroService from '../../services/SeguroService';
import styles from './Doctors.module.css';

const DoctorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useContext(AuthContext);
  const isEditMode = !!id;

  const [doctor, setDoctor] = useState({
    userId: '',
    specialtyId: '',
    sectorId: '',
    licenseNumber: '',
    active: true,
    notes: ''
  });
  
  const [sectors, setSectors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [users, setUsers] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [seguros, setSeguros] = useState([]);
  const [segurosPrestador, setSegurosPrestador] = useState([]);
  const [selectedSeguro, setSelectedSeguro] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [doctorName, setDoctorName] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setPageLoading(true);
      try {
        // --- CORRECCIÓN APLICADA AQUÍ ---
        const [specialtiesRes, servicesRes, sectorsRes, usersRes] = await Promise.all([
          api.get('/specialties?size=1000').then(res => res.data.items || []),
          ServicioService.getAll().then(res => res.data),
          api.get('/sectors?size=1000').then(res => res.data.items || []),
          api.get('/users?role=doctor&unassigned=true').then(res => res.data.items || [])
        ]);
        // --- FIN DE LA CORRECCIÓN ---

        setSpecialties(specialtiesRes);
        setServicios(servicesRes);
        setUsers(usersRes);

        if (authUser.role === 'admin') {
          setSectors(sectorsRes);
        } else if (authUser.role === 'sector_admin' && authUser.sectorId) {
          const userSector = sectorsRes.find(s => s.id === authUser.sectorId);
          setSectors(userSector ? [userSector] : []);
          setDoctor(prev => ({ ...prev, sectorId: authUser.sectorId }));
        }
        
        if (isEditMode) {
          await fetchDoctorData(usersRes);
        }

      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Error al cargar los datos iniciales');
      } finally {
        setPageLoading(false);
      }
    };
    fetchInitialData();
  }, [id, isEditMode, authUser.role, authUser.sectorId]);

  const fetchDoctorData = async (initialUsers) => {
      try {
        const [doctorRes, serviciosPrestador] = await Promise.all([
          api.get(`/doctors/${id}`),
          PrestadorServicioService.getServicios(id)
        ]);
        const doctorData = doctorRes.data;
        setDoctor(doctorData);
        setServiciosSeleccionados(serviciosPrestador.data.map(s => s.id_servicio || s.id));
        
        if (doctorData.userId) {
          const userRes = await api.get(`/users/${doctorData.userId}`);
          setDoctorName(userRes.data.fullName);
          const userExists = initialUsers.some(u => u.id === userRes.data.id);
          if (!userExists) {
            setUsers(prev => [userRes.data, ...prev]);
          }
        }
      } catch (err) {
        console.error('Error fetching doctor:', err);
        setError('Error al cargar los datos del doctor');
      }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDoctor(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (name, selectedOption) => {
    setDoctor(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
  };

  const handleServiciosChange = (e) => {
      const value = parseInt(e.target.value);
      setServiciosSeleccionados(prev =>
        prev.includes(value) ? prev.filter(id => id !== value) : [...prev, value]
      );
  };

  const handleAddSeguro = async () => {
    if (!selectedSeguro) return;
    await PrestadorSeguroService.addSeguro(id, selectedSeguro);
    PrestadorSeguroService.getSegurosByPrestador(id).then(res => setSegurosPrestador(res.data));
    setSelectedSeguro('');
  };

  const handleRemoveSeguro = async (id_seguro) => {
    await PrestadorSeguroService.removeSeguro(id, id_seguro);
    PrestadorSeguroService.getSegurosByPrestador(id).then(res => setSegurosPrestador(res.data));
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
        await PrestadorServicioService.addServicios(doctorId, serviciosSeleccionados);
        setSuccess('Perfil de doctor guardado correctamente.');
        setTimeout(() => navigate('/doctors'), 2000);
      } catch (err) {
        setError(err.response?.data?.message || 'Error al guardar el perfil del doctor.');
      } finally {
        setLoading(false);
      }
  };

  if (pageLoading) {
    return <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}><Spinner animation="border" /></Container>;
  }

  const userOptions = users.map(u => ({ value: u.id, label: `${u.fullName} (${u.email})`}));
  const specialtyOptions = specialties.map(s => ({ value: s.id, label: s.name }));
  const sectorOptions = sectors.map(s => ({ value: s.id, label: s.name }));

  return (
    <Container className="py-4">
      <Card className={styles.doctorCard}>
        <Card.Header className={styles.cardHeader}>
          <h2>{isEditMode ? `Editar Perfil: ${doctorName}` : 'Nuevo Perfil de Doctor'}</h2>
        </Card.Header>
        <Card.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>Usuario del Sistema</Form.Label>
                  <Select
                    options={userOptions}
                    value={userOptions.find(o => o.value === doctor.userId) || null}
                    onChange={(opt) => handleSelectChange('userId', opt)}
                    placeholder="Seleccione un usuario..."
                    isClearable
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>Especialidad</Form.Label>
                   <Select
                    options={specialtyOptions}
                    value={specialtyOptions.find(o => o.value === doctor.specialtyId) || null}
                    onChange={(opt) => handleSelectChange('specialtyId', opt)}
                    placeholder="Seleccione una especialidad..."
                    isClearable
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>Sector</Form.Label>
                  <Select
                    options={sectorOptions}
                    value={sectorOptions.find(o => o.value === doctor.sectorId) || null}
                    onChange={(opt) => handleSelectChange('sectorId', opt)}
                    placeholder="Seleccione un sector..."
                    isDisabled={authUser.role === 'sector_admin'}
                    isClearable
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>Nº de Matrícula / Licencia</Form.Label>
                  <Form.Control type="text" name="licenseNumber" value={doctor.licenseNumber} onChange={handleChange} required className={styles.formControl} />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label className={styles.formLabel}>Notas Internas</Form.Label>
              <Form.Control as="textarea" name="notes" value={doctor.notes || ''} onChange={handleChange} rows={2} className={styles.formControl} />
            </Form.Group>
            
            <Form.Group className="mb-3">
                <Form.Label className={styles.formLabel}>Servicios Prestados</Form.Label>
                <div className="p-3 border rounded" style={{maxHeight: '150px', overflowY: 'auto'}}>
                    {servicios.map(servicio => (
                    <Form.Check key={servicio.id || servicio.id_servicio} type="checkbox" label={`${servicio.nombre_servicio} ($${servicio.precio}, ${servicio.tiempo} min)`} value={servicio.id || servicio.id_servicio} checked={serviciosSeleccionados.includes(servicio.id || servicio.id_servicio)} onChange={handleServiciosChange} />
                    ))}
                </div>
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Check type="switch" label="Activo" name="active" checked={doctor.active} onChange={handleChange} />
            </Form.Group>

            <div className={styles.buttonGroup}>
              <Button variant="secondary" onClick={() => navigate('/doctors')} disabled={loading}>Cancelar</Button>
              <Button type="submit" className={styles.primaryButton} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </Form>

          <hr className="my-4" />

          <h5>Seguros que acepta este prestador</h5>
          <Table size="sm" bordered>
            <thead>
              <tr>
                <th>Seguro</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {segurosPrestador.map(seguro => (
                <tr key={seguro.id_seguro}>
                  <td>{seguro.nombre}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemoveSeguro(seguro.id_seguro)}
                    >
                      Quitar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Form inline="true" className="mb-3">
            <Form.Select
              value={selectedSeguro}
              onChange={e => setSelectedSeguro(e.target.value)}
              style={{ width: 200, display: 'inline-block', marginRight: 8 }}
            >
              <option value="">Agregar seguro...</option>
              {seguros
                .filter(s => !segurosPrestador.some(sp => sp.id_seguro === s.id_seguro))
                .map(seguro => (
                  <option key={seguro.id_seguro} value={seguro.id_seguro}>
                    {seguro.nombre}
                  </option>
                ))}
            </Form.Select>
            <Button
              size="sm"
              variant="primary"
              onClick={handleAddSeguro}
              disabled={!selectedSeguro}
            >
              Agregar
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DoctorForm;