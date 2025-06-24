import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Alert, Table } from 'react-bootstrap';
import api from '../../utils/api';

const DoctorSchedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Para el formulario de nuevo horario
  const [newSchedule, setNewSchedule] = useState({
    dia: '1', // 1 = Lunes
    hora_inicio: '08:00',
    hora_fin: '16:00',
  });

  const daysOfWeek = [
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sábado' },
    { value: '7', label: 'Domingo' }
  ];

  useEffect(() => {
    fetchDoctorData();
    fetchDoctorSchedules();
  }, [id]);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors/${id}`);
      setDoctor(response.data);
    } catch (err) {
      setError('Error al cargar los datos del doctor');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctors/${id}/schedules`);
      setSchedules(response.data);
    } catch (err) {
      setError('Error al cargar los horarios del doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule({
      ...newSchedule,
      [name]: value
    });
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post(`/doctors/${id}/schedules`, newSchedule);
      setSchedules([...schedules, response.data]);
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
      setLoading(true);
      await api.delete(`/doctors/${id}/schedules/${scheduleId}`);
      setSchedules(schedules.filter(schedule => schedule.id !== scheduleId));
      setSuccess('Horario eliminado correctamente');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el horario');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayNumber) => {
    const day = daysOfWeek.find(d => d.value === dayNumber.toString());
    return day ? day.label : 'Desconocido';
  };

  if (loading && !doctor) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {doctor && (
        <>
          <Card className="mb-4">
            <Card.Header>
              <h2>Horarios del Doctor: {doctor.name || doctor.user?.fullName}</h2>
              <p className="text-muted mb-0">Especialidad: {doctor.specialty?.name}</p>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <h4>Horarios actuales</h4>
              
              {schedules.length === 0 ? (
                <Alert variant="info">Este doctor no tiene horarios configurados</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th>Hora inicio</th>
                      <th>Hora fin</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map(schedule => (
                      <tr key={schedule.id}>
                        <td>{getDayName(schedule.dia)}</td>
                        <td>{schedule.hora_inicio}</td>
                        <td>{schedule.hora_fin}</td>
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            disabled={loading}
                          >
                            <i className="bi bi-trash"></i> Eliminar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h4>Añadir nuevo horario</h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddSchedule}>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Día de la semana</Form.Label>
                      <Form.Select
                        name="dia"
                        value={newSchedule.dia}
                        onChange={handleScheduleChange}
                        required
                      >
                        {daysOfWeek.map(day => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hora inicio</Form.Label>
                      <Form.Control
                        type="time"
                        name="hora_inicio"
                        value={newSchedule.hora_inicio}
                        onChange={handleScheduleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hora fin</Form.Label>
                      <Form.Control
                        type="time"
                        name="hora_fin"
                        value={newSchedule.hora_fin}
                        onChange={handleScheduleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2">
                  <Button 
                    variant="secondary" 
                    onClick={() => navigate('/doctors')}
                    disabled={loading}
                  >
                    Volver
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Agregando...' : 'Agregar Horario'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

export default DoctorSchedule;
