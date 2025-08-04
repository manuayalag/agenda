import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner, ListGroup } from 'react-bootstrap';
import api from '../../utils/api';
import styles from './Doctors.module.css';

const DoctorAbsences = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newAbsence, setNewAbsence] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    hora_inicio: '00:00',
    hora_fin: '23:59',
    motivo: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [doctorRes, absencesRes] = await Promise.all([
          api.get(`/doctors/${id}`),
          api.get(`/doctors/${id}/absences`)
        ]);
        setDoctor(doctorRes.data);
        setAbsences(absencesRes.data);
      } catch (err) {
        setError('Error al cargar los datos.');
      } finally {
        setPageLoading(false);
      }
    };
    fetchInitialData();
  }, [id]);

  const handleAbsenceChange = (e) => {
    setNewAbsence({ ...newAbsence, [e.target.name]: e.target.value });
  };

  const handleAddAbsence = async (e) => {
    e.preventDefault();
    if (!newAbsence.fecha_inicio || !newAbsence.fecha_fin) {
        setError("Las fechas de inicio y fin son obligatorias.");
        return;
    }
    setLoading(true);
    setError(''); setSuccess('');
    try {
        const response = await api.post(`/doctors/${id}/absences`, newAbsence);
        setAbsences([response.data, ...absences].sort((a, b) => new Date(b.fecha_inicio) - new Date(a.fecha_inicio)));
        setSuccess('Ausencia añadida correctamente');
        setNewAbsence({ fecha_inicio: '', fecha_fin: '', hora_inicio: '00:00', hora_fin: '23:59', motivo: '' });
    } catch (err) {
        setError(err.response?.data?.message || 'Error al añadir la ausencia');
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteAbsence = async (absenceId) => {
      try {
          await api.delete(`/doctors/absences/${absenceId}`);
          setAbsences(absences.filter(a => a.id !== absenceId));
          setSuccess('Ausencia eliminada correctamente');
      } catch (err) {
          setError(err.response?.data?.message || 'Error al eliminar la ausencia');
      }
  };

  if (pageLoading) {
    return <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}><Spinner animation="border" /></Container>;
  }

  return (
    <Container className="py-4">
        <Card className={styles.doctorCard}>
            <Card.Header className={styles.cardHeader}>
                <div>
                    <h2>Gestionar Ausencias</h2>
                    <p className="text-muted mb-0">Doctor: {doctor?.user?.fullName}</p>
                </div>
                <Button variant="secondary" onClick={() => navigate(`/doctors/${id}/schedule`)}>
                    <i className="bi bi-clock-history me-2"></i>Volver a Horarios
                </Button>
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
                
                <Form onSubmit={handleAddAbsence}>
                    <h5 className="mb-3">Añadir Nueva Ausencia</h5>
                    <Row>
                        <Col sm={6} md={3}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Desde</Form.Label><Form.Control type="date" name="fecha_inicio" value={newAbsence.fecha_inicio} onChange={handleAbsenceChange} required /></Form.Group></Col>
                        <Col sm={6} md={3}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Hasta</Form.Label><Form.Control type="date" name="fecha_fin" value={newAbsence.fecha_fin} onChange={handleAbsenceChange} required /></Form.Group></Col>
                        <Col sm={6} md={2}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Hora Inicio</Form.Label><Form.Control type="time" name="hora_inicio" value={newAbsence.hora_inicio} onChange={handleAbsenceChange} required /></Form.Group></Col>
                        <Col sm={6} md={2}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Hora Fin</Form.Label><Form.Control type="time" name="hora_fin" value={newAbsence.hora_fin} onChange={handleAbsenceChange} required /></Form.Group></Col>
                        <Col md={2} className="d-flex align-items-end">
                            <Button type="submit" className={`${styles.primaryButton} w-100 mb-3`} disabled={loading}>
                                {loading ? <Spinner as="span" size="sm" /> : 'Añadir'}
                            </Button>
                        </Col>
                    </Row>
                    <Form.Group><Form.Label className={styles.formLabel}>Motivo (opcional)</Form.Label><Form.Control type="text" name="motivo" value={newAbsence.motivo} onChange={handleAbsenceChange} /></Form.Group>
                </Form>
                <hr className="my-4"/>
                <h5 className="mb-3">Historial de Ausencias</h5>
                <ListGroup variant="flush" style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {absences.length > 0 ? absences.map(absence => (
                        <ListGroup.Item key={absence.id} className="d-flex justify-content-between align-items-center ps-0">
                            <div>
                                <strong>{absence.motivo || 'Ausencia General'}</strong>
                                <small className="d-block text-muted">
                                    Del {absence.fecha_inicio} al {absence.fecha_fin} (de {absence.hora_inicio} a {absence.hora_fin})
                                </small>
                            </div>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteAbsence(absence.id)} title="Eliminar Ausencia">
                                <i className="bi bi-trash-fill"></i>
                            </Button>
                        </ListGroup.Item>
                    )) : <Alert variant="light" className="text-center">No hay ausencias registradas.</Alert>}
                </ListGroup>
            </Card.Body>
        </Card>
    </Container>
  );
};

export default DoctorAbsences;