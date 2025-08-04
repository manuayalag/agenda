import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Alert, Table, Spinner } from 'react-bootstrap';
import api from '../../utils/api';
import styles from './Doctors.module.css';

const DoctorSchedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [newSchedule, setNewSchedule] = useState({ dia: '1', hora_inicio: '08:00', hora_fin: '16:00' });

  const daysOfWeek = [
    { value: '1', label: 'Lunes' }, { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' }, { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' }, { value: '6', label: 'Sábado' },
    { value: '7', label: 'Domingo' }
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [doctorRes, schedulesRes] = await Promise.all([
          api.get(`/doctors/${id}`),
          api.get(`/doctors/${id}/schedules`)
        ]);
        setDoctor(doctorRes.data);
        setSchedules(schedulesRes.data.sort((a,b) => a.dia - b.dia));
      } catch (err) {
        setError('Error al cargar los datos del doctor.');
      } finally {
        setPageLoading(false);
      }
    };
    fetchAllData();
  }, [id]);

  const handleScheduleChange = (e) => {
    setNewSchedule({ ...newSchedule, [e.target.name]: e.target.value });
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); setSuccess('');
    try {
      const response = await api.post(`/doctors/${id}/schedules`, newSchedule);
      setSchedules([...schedules, response.data].sort((a,b) => a.dia - b.dia));
      setSuccess('Horario añadido correctamente');
      setNewSchedule({ dia: '1', hora_inicio: '08:00', hora_fin: '16:00' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al añadir el horario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await api.delete(`/doctors/${id}/schedules/${scheduleId}`);
      setSchedules(schedules.filter(s => s.id !== scheduleId));
      setSuccess('Horario eliminado correctamente');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el horario');
    }
  };

  const getDayName = (dayNumber) => daysOfWeek.find(d => d.value === String(dayNumber))?.label || 'Desconocido';

  if (pageLoading) {
    return <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}><Spinner animation="border" /></Container>;
  }

  return (
    <Container className="py-4">
      {doctor && (
        <>
          <Card className={`${styles.doctorCard} mb-4`}>
            <Card.Header className={styles.cardHeader}>
              <div>
                <h2>Horarios de: {doctor.user?.fullName}</h2>
                <p className="text-muted mb-0">Especialidad: {doctor.specialty?.name}</p>
              </div>
              {/* Botón para navegar a la gestión de ausencias */}
              <Button variant="warning" onClick={() => navigate(`/doctors/${id}/absences`)}>
                <i className="bi bi-calendar-x-fill me-2"></i>Gestionar Ausencias
              </Button>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
              {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
              
              <h4>Horarios Semanales Fijos</h4>
              
              {schedules.length === 0 ? (
                <Alert variant="info">Este doctor no tiene horarios configurados.</Alert>
              ) : (
                <Table striped hover responsive>
                  <thead>
                    <tr><th>Día</th><th>Hora Inicio</th><th>Hora Fin</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {schedules.map(schedule => (
                      <tr key={schedule.id}>
                        <td>{getDayName(schedule.dia)}</td>
                        <td>{schedule.hora_inicio}</td>
                        <td>{schedule.hora_fin}</td>
                        <td>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteSchedule(schedule.id)}>
                            <i className="bi bi-trash-fill"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card className={styles.doctorCard}>
            <Card.Header className={styles.cardHeader}>
              <h4>Añadir Nuevo Horario Fijo</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddSchedule}>
                <Row className="align-items-end">
                  <Col md={4}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Día</Form.Label><Form.Select name="dia" value={newSchedule.dia} onChange={handleScheduleChange} required className={styles.formControl}>{daysOfWeek.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</Form.Select></Form.Group></Col>
                  <Col md={3}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Hora Inicio</Form.Label><Form.Control type="time" name="hora_inicio" value={newSchedule.hora_inicio} onChange={handleScheduleChange} required className={styles.formControl} /></Form.Group></Col>
                  <Col md={3}><Form.Group className="mb-3"><Form.Label className={styles.formLabel}>Hora Fin</Form.Label><Form.Control type="time" name="hora_fin" value={newSchedule.hora_fin} onChange={handleScheduleChange} required className={styles.formControl} /></Form.Group></Col>
                  <Col md={2}>
                    <Form.Group className="mb-3 d-grid">
                      <Button type="submit" className={styles.primaryButton} disabled={loading}>
                        {loading ? <Spinner as="span" size="sm" /> : 'Añadir'}
                      </Button>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>

          <div className="text-center mt-4">
            <Button variant="secondary" onClick={() => navigate('/doctors')}>Volver a la Lista de Doctores</Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default DoctorSchedule;