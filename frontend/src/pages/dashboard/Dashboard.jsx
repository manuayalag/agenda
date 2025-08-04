import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Spinner, Alert, Form } from 'react-bootstrap';
import Select from 'react-select';
import { AuthContext } from '../../context/AuthContextValue';
// ⭐ CORRECCIÓN DE IMPORTACIÓN: Se importa 'ServicioService' desde su propio archivo
import { AppointmentService, DoctorService, PatientService, SectorService } from '../../utils/api';
import ServicioService from '../../services/ServicioService'; // <-- LÍNEA CORREGIDA
import Calendar from 'react-calendar';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-calendar/dist/Calendar.css';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAdmin, isSectorAdmin, isDoctor } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weekAppointments: 0,
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyAppointments, setDailyAppointments] = useState([]);
  const [monthlyAppointments, setMonthlyAppointments] = useState(new Set());
  const [activeMonth, setActiveMonth] = useState(new Date());
  
  const [filters, setFilters] = useState({
    prestadorId: isDoctor ? (user.prestador?.id || '') : '',
    patientId: '',
    sectorId: isSectorAdmin && !isAdmin ? (user.sectorId || '') : '',
    status: 'scheduled',
  });
  
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [sectors, setSectors] = useState([]);

  const fetchFiltersData = useCallback(async () => {
    try {
      const [doctorsRes, patientsRes, sectorsRes] = await Promise.all([
        DoctorService.getAll(),
        PatientService.getAll({ params: { size: 10000 } }),
        SectorService.getAll({ params: { size: 1000 } })
      ]);
      setDoctors((doctorsRes.data || []).map(d => ({ value: d.id, label: d.user.fullName })));
      setPatients((patientsRes.data.items || []).map(p => ({ value: p.id, label: p.fullName })));
      setSectors((sectorsRes.data.items || []).map(s => ({ value: s.id, label: s.name })));
    } catch (err) {
      setError('Error al cargar datos para filtros.');
      console.error(err);
    }
  }, []);

  const fetchAppointments = useCallback(async (date, month) => {
    setLoading(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

    try {
      const baseParams = { ...filters };
      Object.keys(baseParams).forEach(key => (baseParams[key] === '' || baseParams[key] === null) && delete baseParams[key]);
      
      const [dailyRes, monthlyRes, statsRes] = await Promise.all([
        AppointmentService.getFiltered({ ...baseParams, startDate: dateStr, endDate: dateStr }),
        AppointmentService.getFiltered({ ...baseParams, startDate: monthStart, endDate: monthEnd }),
        AppointmentService.getFiltered({ startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') })
      ]);

      setDailyAppointments((dailyRes.data.data || []).sort((a, b) => a.startTime.localeCompare(b.startTime)));
      const monthlyDates = new Set((monthlyRes.data.data || []).map(app => app.date));
      setMonthlyAppointments(monthlyDates);
      
      const allUpcoming = statsRes.data.data || [];
      setStats({
          todayAppointments: allUpcoming.filter(a => a.date === format(new Date(), 'yyyy-MM-dd')).length,
          weekAppointments: allUpcoming.length
      });

    } catch (err) {
      setError('Error al cargar las citas.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFiltersData();
  }, [fetchFiltersData]);
  
  useEffect(() => {
    fetchAppointments(selectedDate, activeMonth);
  }, [selectedDate, activeMonth, fetchAppointments]);

  const handleFilterChange = (name, selectedOption) => {
    setFilters(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
  };
  
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (monthlyAppointments.has(dateStr)) {
        return <div className="has-appointments-dot"></div>;
      }
    }
    return null;
  };
  
  if (loading && doctors.length === 0) {
    return <div className="text-center my-5"><Spinner animation="border" /></div>;
  }

  return (
    <div className="dashboard-container">
      <h2 className="mb-4">Dashboard</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mb-4">
        <Col lg={8}>
          <Row>
            <Col md={6} className="mb-3">
              <Card className="stat-card">
                <Card.Body>
                  <div className="stat-icon icon-primary"><i className="bi bi-calendar-check"></i></div>
                  <div className="stat-info"><h3>{stats.todayAppointments}</h3><p>Citas para Hoy</p></div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-3">
              <Card className="stat-card">
                <Card.Body>
                  <div className="stat-icon icon-success"><i className="bi bi-calendar-week"></i></div>
                  <div className="stat-info"><h3>{stats.weekAppointments}</h3><p>Citas en los Próximos 7 Días</p></div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
        <Col lg={4}>
            <Card className="action-card">
                <Card.Body className="d-flex flex-column justify-content-center p-3">
                    <Button as={Link} to="/appointments/add" variant="primary" className="w-100 mb-2">
                        <i className="bi bi-calendar-plus-fill me-2"></i>Agendar Nueva Cita
                    </Button>
                    <Button as={Link} to="/patients/add" variant="outline-primary" className="w-100">
                        <i className="bi bi-person-plus-fill me-2"></i>Registrar Nuevo Paciente
                    </Button>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      <Card className="calendar-card">
        <div className="calendar-header">
          <h4>Calendario de Citas</h4>
        </div>
        <Row>
          <Col lg={3} className="border-end-lg mb-4 mb-lg-0">
            <h5>Filtros</h5>
            <Form>
              {!isDoctor && (
                <Form.Group className="mb-3">
                  <Form.Label>Médico</Form.Label>
                  <Select options={doctors} isClearable placeholder="Todos" onChange={opt => handleFilterChange('prestadorId', opt)} />
                </Form.Group>
              )}
              {isAdmin && (
                <Form.Group className="mb-3">
                  <Form.Label>Sector</Form.Label>
                  <Select options={sectors} isClearable placeholder="Todos" onChange={opt => handleFilterChange('sectorId', opt)} />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Paciente</Form.Label>
                <Select options={patients} isClearable placeholder="Todos" onChange={opt => handleFilterChange('patientId', opt)} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                <Select
                  options={[
                    { value: 'scheduled', label: 'Programada' },
                    { value: 'completed', label: 'Completada' },
                    { value: 'cancelled', label: 'Cancelada' },
                    { value: 'no_show', label: 'No Asistió' },
                    { value: '', label: 'Todos' }
                  ]}
                  defaultValue={{ value: 'scheduled', label: 'Programada' }}
                  onChange={opt => handleFilterChange('status', opt)}
                />
              </Form.Group>
            </Form>
          </Col>

          <Col lg={5} className="border-end-lg mb-4 mb-lg-0 d-flex justify-content-center align-items-center">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              locale="es-ES"
              className="border-0 shadow-sm"
              tileContent={tileContent}
              onActiveStartDateChange={({ activeStartDate }) => setActiveMonth(activeStartDate)}
            />
          </Col>

          <Col lg={4}>
            <h5>Citas para el {format(selectedDate, 'dd MMMM, yyyy', { locale: es })}</h5>
            {loading ? <div className="text-center"><Spinner animation="border" size="sm" /></div> :
              <div className="appointment-list">
                {dailyAppointments.length > 0 ? dailyAppointments.map(app => (
                  <div key={app.id} className="appointment-item">
                    <div className="appointment-time">{app.startTime.substring(0, 5)}</div>
                    <div className="appointment-details">
                      <strong>{app.patient?.fullName || 'N/A'}</strong>
                      <small>{app.servicio?.nombre_servicio || 'N/A'}</small>
                      {!isDoctor && <small className="d-block text-primary">{app.prestador?.user?.fullName || 'N/A'}</small>}
                    </div>
                  </div>
                )) : <Alert variant="light" className="text-center mt-3">No hay citas para mostrar.</Alert>}
              </div>
            }
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;