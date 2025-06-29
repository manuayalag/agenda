import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { AuthContext } from '../../context/AuthContextValue';
import { AppointmentService, DoctorService, PatientService } from '../../utils/api';

const Dashboard = () => {
  const { user, isAdmin, isSectorAdmin } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weekAppointments: 0,
    totalDoctors: 0,
    totalPatients: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Obtener fecha actual y rango de la semana
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const weekStart = new Date();
        weekStart.setDate(today.getDate());
        
        const weekEnd = new Date();
        weekEnd.setDate(today.getDate() + 7);
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        
        // Parámetros para filtrar citas
        const params = {
          startDate: todayStr,
          endDate: weekEndStr
        };
        
        // Variable para almacenar la respuesta de las citas y estadísticas
        let appointmentsResponse = { data: [] };
        let totalDoctors = 0;
        let totalPatients = 0;
          try {
          if (user.role === 'doctor') {
            // Para usuarios doctores, buscar sus citas específicas
            // Buscar el ID del prestador correctamente
            let prestadorId = null;
            if (user.prestador && user.prestador.id) {
              prestadorId = user.prestador.id;
            } else if (user.prestadorId) {
              prestadorId = user.prestadorId;
            } else if (user.doctor && user.doctor.id) { // fallback legacy
              prestadorId = user.doctor.id;
            }
            if (!prestadorId) {
              console.warn("Este usuario doctor no tiene un ID de prestador asociado", user);
            } else {
              const response = await AppointmentService.getDoctorAppointments(prestadorId, params);
              // Manejar tanto la respuesta directa como la estructura con data
              appointmentsResponse = Array.isArray(response.data) ? { data: response.data } : response;
            }
          } else {
            // Si es admin de sector, filtrar por su sector
            if (user.role === 'sector_admin' && user.sectorId) {
              params.sectorId = user.sectorId;
            }
            
            const response = await AppointmentService.getFiltered(params);
            // Manejar tanto la respuesta directa como la estructura con data
            appointmentsResponse = Array.isArray(response.data) ? { data: response.data } : response;
            
            // Obtener total de doctores y pacientes (solo para admins y sector_admin)
            if (isAdmin || isSectorAdmin) {
              try {
                const doctorsResponse = user.role === 'sector_admin' && user.sectorId 
                  ? await DoctorService.getBySector(user.sectorId)
                  : await DoctorService.getAll();
                  
                totalDoctors = doctorsResponse?.data?.length || 0;
              } catch (err) {
                console.error("Error al obtener doctores:", err);
              }
              
              try {
                const patientsResponse = await PatientService.getAll();
                totalPatients = patientsResponse?.data?.length || 0;
              } catch (err) {
                console.error("Error al obtener pacientes:", err);
                // No bloqueamos la ejecución si hay un error al cargar pacientes
              }
            }
          }
        } catch (err) {
          console.error("Error al obtener citas:", err);
        }
          // Filtrar citas de hoy y de la semana
        const allAppointments = appointmentsResponse?.data?.data || appointmentsResponse?.data || [];
        const todayAppointments = allAppointments.filter(
          app => app.date === todayStr
        );
        
        // Obtener próximas 5 citas
        const upcomingApps = allAppointments
          .filter(app => app.status === 'scheduled')
          .sort((a, b) => {
            if (a.date !== b.date) {
              return a.date.localeCompare(b.date);
            }
            return a.startTime.localeCompare(b.startTime);
          })
          .slice(0, 5);
        
        // Actualizar estadísticas
        setStats({
          todayAppointments: todayAppointments.length,
          weekAppointments: allAppointments.length,
          totalDoctors,
          totalPatients
        });
        
        setUpcomingAppointments(upcomingApps);
        setError('');
      } catch (err) {
        setError('Error al cargar los datos del dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, isSectorAdmin, isAdmin]);
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge bg="primary">Programada</Badge>;
      case 'completed':
        return <Badge bg="success">Completada</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelada</Badge>;
      case 'no_show':
        return <Badge bg="warning">No asistió</Badge>;
      default:
        return <Badge bg="secondary">Desconocido</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>
      
      {error && (
        <Alert variant="danger">{error}</Alert>
      )}
      
      <Row>
        <Col lg={3} md={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-primary text-white p-3 me-3">
                <i className="bi bi-calendar-check fs-4"></i>
              </div>
              <div>
                <h6 className="mb-1">Citas Hoy</h6>
                <h3 className="mb-0">{stats.todayAppointments}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-success text-white p-3 me-3">
                <i className="bi bi-calendar-week fs-4"></i>
              </div>
              <div>
                <h6 className="mb-1">Citas esta semana</h6>
                <h3 className="mb-0">{stats.weekAppointments}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        {isSectorAdmin && (
          <>
            <Col lg={3} md={6} className="mb-4">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle bg-info text-white p-3 me-3">
                    <i className="bi bi-people fs-4"></i>
                  </div>
                  <div>
                    <h6 className="mb-1">Doctores</h6>
                    <h3 className="mb-0">{stats.totalDoctors}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            
            <Col lg={3} md={6} className="mb-4">
              <Card className="border-0 shadow-sm h-100">
                <Card.Body className="d-flex align-items-center">
                  <div className="rounded-circle bg-warning text-white p-3 me-3">
                    <i className="bi bi-person-vcard fs-4"></i>
                  </div>
                  <div>
                    <h6 className="mb-1">Pacientes</h6>
                    <h3 className="mb-0">{stats.totalPatients}</h3>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </>
        )}
      </Row>
      
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Próximas Citas</h5>
              <Button 
                as={Link}
                to="/appointments"
                variant="outline-primary"
                size="sm"
              >
                Ver Todas
              </Button>
            </Card.Header>
            <Card.Body>
              {upcomingAppointments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Paciente</th>
                        {user.role !== 'doctor' && <th>Doctor</th>}
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingAppointments.map(appointment => (                        <tr key={appointment.id}>
                          <td>{appointment.date}</td>
                          <td>{appointment.startTime ? appointment.startTime.substring(0, 5) : '--:--'}</td>
                          <td>{appointment.patient?.fullName || 'Paciente no disponible'}</td>
                          {user.role !== 'doctor' && (
                            <td>
                              {console.log(appointment.prestador.user.fullName)}
                              {appointment.prestador.user.fullName ? appointment.prestador.user.fullName : 
                               'Doctor no disponible'}
                            </td>
                          )}
                          <td>{getStatusBadge(appointment.status)}</td>
                          <td>
                            <Button
                              as={Link}
                              to={`/appointments/edit/${appointment.id}`}
                              variant="outline-primary"
                              size="sm"
                            >
                              Ver
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No hay citas próximas</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {isAdmin && (
        <Row className="mt-4">
          <Col md={6} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Acciones Rápidas (Admin)</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    as={Link}
                    to="/admin/users/add"
                    variant="outline-primary"
                  >
                    Agregar Usuario
                  </Button>
                  <Button 
                    as={Link}
                    to="/admin/sectors/add"
                    variant="outline-primary"
                  >
                    Agregar Sector
                  </Button>
                  <Button 
                    as={Link}
                    to="/admin/specialties/add"
                    variant="outline-primary"
                  >
                    Agregar Especialidad
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} className="mb-4">
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Gestión Clínica</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    as={Link}
                    to="/doctors/add"
                    variant="outline-success"
                  >
                    Agregar Doctor
                  </Button>
                  <Button 
                    as={Link}
                    to="/patients/add"
                    variant="outline-success"
                  >
                    Registrar Paciente
                  </Button>
                  <Button 
                    as={Link}
                    to="/appointments/add"
                    variant="outline-success"
                  >
                    Nueva Cita
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
