import { useState, useEffect, useContext } from 'react';
import { Container, Card, Table, Button, Badge, Modal, Form, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContextValue';
import styles from './Doctors.module.css';

const Doctors = () => {
  const { user } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [allSpecialties, setAllSpecialties] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const endpoint = user?.role === 'sector_admin' && user?.sectorId
          ? `/doctors?sectorId=${user.sectorId}`
          : '/doctors';
        
        // --- CORRECCIÓN APLICADA AQUÍ ---
        const [doctorsResponse, specialtiesResponse] = await Promise.all([
          api.get(endpoint),
          api.get('/specialties?size=1000') // Pedimos todas las especialidades
        ]);

        setDoctors(doctorsResponse.data);
        // Extraemos la lista 'items' de la respuesta paginada de especialidades
        setAllSpecialties(specialtiesResponse.data.items || []);
        // --- FIN DE LA CORRECCIÓN ---

        setError(null);
      } catch (err) {
        setError('Error al cargar datos: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

  const handleShowDeleteModal = (doctor) => {
    setDoctorToDelete(doctor);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => setShowDeleteModal(false);

  const handleDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    try {
      await api.delete(`/doctors/${doctorToDelete.id}`);
      setDoctors(doctors.filter(doctor => doctor.id !== doctorToDelete.id));
      handleCloseDeleteModal();
    } catch (err) {
      setError('Error al eliminar doctor: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const nameMatch = doctor.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const specialtyMatch = !specialtyFilter || doctor.specialty?.id === parseInt(specialtyFilter);
    return nameMatch && specialtyMatch;
  });

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" style={{ color: '#275950' }} role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className={styles.doctorCard}>
        <Card.Header className={styles.cardHeader}>
          <h2>Gestión de Doctores</h2>
          <Link to="/doctors/add" className={`btn ${styles.primaryButton}`}>
            <i className="bi bi-plus-circle me-2"></i>Nuevo Doctor
          </Link>
        </Card.Header>
        <Card.Body className="p-4">
          {error && <div className="alert alert-danger">{error}</div>}

          <Form className="mb-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Control
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.filterInput} 
                />
              </Col>
              <Col md={6}>
                <Form.Select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className={styles.filterInput}
                >
                  <option value="">Todas las especialidades</option>
                  {allSpecialties.map(specialty => (
                    <option key={specialty.id} value={specialty.id}>{specialty.name}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Form>

          <Table responsive hover className={styles.doctorTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Sector</th>
                <th>Email</th>
                <th>Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">No se encontraron doctores.</td>
                </tr>
              ) : (
                filteredDoctors.map(doctor => (
                  <tr key={doctor.id}>
                    <td>{doctor.id}</td>
                    <td>{doctor.user?.fullName || 'N/A'}</td>
                    <td>{doctor.specialty?.name || '-'}</td>
                    <td>{doctor.sector?.name || '-'}</td>
                    <td>{doctor.user?.email || '-'}</td>
                    <td>
                      <Badge bg={doctor.active ? "success" : "secondary"}>
                        {doctor.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className={styles.actionButtons}>
                      <Link to={`/doctors/edit/${doctor.id}`} className="btn btn-sm btn-warning" title="Editar">
                        <i className="bi bi-pencil-fill"></i>
                      </Link>
                      <Link to={`/doctors/${doctor.id}/schedule`} className="btn btn-sm btn-info" title="Horarios">
                        <i className="bi bi-calendar-week"></i>
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => handleShowDeleteModal(doctor)} title="Eliminar">
                        <i className="bi bi-trash-fill"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro que deseas eliminar el perfil del doctor asociado a <strong>{doctorToDelete?.user?.fullName}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteDoctor}>Eliminar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Doctors;