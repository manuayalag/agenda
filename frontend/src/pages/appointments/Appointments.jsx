import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Badge, Pagination, Alert, Spinner, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContextValue';
import { AppointmentService, DoctorService, PatientService, SectorService } from '../../utils/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Appointments = () => {
  const { user, isAdmin, isSectorAdmin, isDoctor } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [sectors, setSectors] = useState([]);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    doctorId: '',
    status: '',
    sectorId: ''
  });
  
  // Estado para el modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Cargar sectores (solo para admin y admin de sector)
        if (isSectorAdmin && !isDoctor) {
          try {
            const sectorsResponse = await SectorService.getAll();
            setSectors(sectorsResponse.data);
          } catch (err) {
            console.error('Error al cargar sectores:', err);
          }
        }
        
        // Cargar doctores (filtrar por sector si es admin de sector)
        try {
          let doctorsResponse;
          if (isSectorAdmin && user.role === 'sector_admin' && user.sectorId) {
            doctorsResponse = await DoctorService.getBySector(user.sectorId);
          } else {
            doctorsResponse = await DoctorService.getAll();
          }
          setDoctors(doctorsResponse.data);
        } catch (err) {
          console.error('Error al cargar doctores:', err);
        }
        
        // Establecer fecha por defecto (últimos 30 días)
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        setFilters(prev => ({
          ...prev,
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }));
        
        // Cargar citas iniciales
        await fetchAppointments();
        
      } catch (err) {
        setError('Error al cargar los datos iniciales');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSectorAdmin, isDoctor]);
    // Función para cargar citas con los filtros actuales
  const fetchAppointments = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        ...filters,
        page,
        limit: itemsPerPage
      };
      
      let response;
      console.log('Solicitando citas con parámetros:', params);
      
      if (isDoctor && user.doctorId) {
        // Si es doctor, cargar solo sus citas
        response = await AppointmentService.getDoctorAppointments(user.doctorId, params);
      } else {
        // Si es admin o admin de sector, aplicar filtros
        if (isSectorAdmin && user.role === 'sector_admin' && user.sectorId) {
          params.sectorId = user.sectorId;
        }
        
        response = await AppointmentService.getFiltered(params);
      }
      
      console.log('Respuesta de citas:', response.data);
      
      // La API ahora siempre devuelve una estructura consistente
      const { data, pagination } = response.data;
      
      if (!data || !Array.isArray(data)) {
        console.error('Formato de respuesta inesperado:', response.data);
        setError('Error en el formato de datos recibidos');
        setAppointments([]);
        setTotalPages(1);
        return;
      }
      
      setAppointments(data);
      
      // Actualizar información de paginación
      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setCurrentPage(pagination.currentPage || 1);
        console.log(`Mostrando página ${pagination.currentPage} de ${pagination.totalPages} (${pagination.totalItems} citas en total)`);
      } else {
        setTotalPages(1);
        setCurrentPage(1);
      }
      
    } catch (err) {
      setError('Error al cargar las citas. Por favor, intente de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
    // Aplicar filtros
  const handleApplyFilters = (e) => {
    e.preventDefault();
    
    // Validar fechas
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      if (startDate > endDate) {
        setError('La fecha de inicio no puede ser posterior a la fecha final');
        return;
      }
    }
    
    // Aplicar filtros
    setCurrentPage(1);
    fetchAppointments(1);
    
    // Limpiar mensajes
    setError('');
  };
  
  // Resetear filtros
  const handleResetFilters = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setFilters({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      doctorId: '',
      status: '',
      sectorId: ''
    });
    
    // Aplicar filtros reseteados
    setTimeout(() => fetchAppointments(1), 100);
  };
  
  // Cambiar de página
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAppointments(page);
  };
  
  // Modal para confirmar eliminación
  const confirmDelete = (appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };
  
  // Eliminar cita
  const deleteAppointment = async () => {
    try {
      setLoading(true);
      await AppointmentService.delete(appointmentToDelete.id);
      setSuccess(`Cita eliminada correctamente`);
      
      // Cerrar modal y actualizar lista
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
      
      // Recargar citas
      fetchAppointments(currentPage);
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError('Error al eliminar la cita');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  // Formatear fecha para mostrar
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      // Extraemos los componentes de fecha directamente de la cadena
      // para evitar problemas de zona horaria
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      
      // Usamos componentes de fecha para crear un objeto date en nuestra zona horaria
      // que represente exactamente el día solicitado sin conversiones UTC
      const date = new Date(year, month - 1, day);
      
      // Verificar si es una fecha válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', dateStr);
        return dateStr;
      }
      
      // Formatear la fecha con día de la semana
      return format(date, 'EEEE, dd MMMM yyyy', { locale: es });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return dateStr;
    }
  };
  
  // Formatear hora para mostrar
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };
  
  // Generar etiqueta de estado
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
    // Renderizar paginación
  const renderPagination = () => {
    // No mostrar paginación si no hay citas o solo hay una página
    if (totalPages <= 1 || appointments.length === 0) {
      return null;
    }
    
    const items = [];
    
    // Botón para primera página
    items.push(
      <Pagination.First 
        key="first" 
        onClick={() => handlePageChange(1)} 
        disabled={currentPage === 1}
      />
    );
    
    // Botón para página anterior
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />
    );
    
    // Páginas individuales
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    // Si hay muchas páginas, añadir un ellipsis al inicio
    if (startPage > 1) {
      items.push(<Pagination.Item key="ellipsis-start" disabled>{startPage > 2 ? '...' : '2'}</Pagination.Item>);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // Si hay muchas páginas, añadir un ellipsis al final
    if (endPage < totalPages) {
      items.push(<Pagination.Item key="ellipsis-end" disabled>{endPage < totalPages - 1 ? '...' : totalPages - 1}</Pagination.Item>);
    }
    
    // Botón para página siguiente
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    );
    
    // Botón para última página
    items.push(
      <Pagination.Last 
        key="last" 
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
      />
    );
    
    return (
      <div className="d-flex flex-column align-items-center mt-4">
        <Pagination size="lg">{items}</Pagination>
        <div className="text-muted mt-2">
          Página {currentPage} de {totalPages} {appointments.length > 0 ? `(Mostrando ${appointments.length} citas)` : ''}
        </div>
      </div>
    );
  };
  
  return (
    <Container fluid className="py-4">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Gestión de Citas</h4>
          <Button 
            as={Link}
            to="/appointments/add"
            variant="primary"
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nueva Cita
          </Button>
        </Card.Header>
        
        <Card.Body>
          {success && (
            <Alert 
              variant="success" 
              dismissible 
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          )}
          
          {error && (
            <Alert 
              variant="danger" 
              dismissible 
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          
          {/* Filtros */}
          <Form onSubmit={handleApplyFilters} className="mb-4">
            <Row>
              <Col lg={2} md={4} sm={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Desde</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              
              <Col lg={2} md={4} sm={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Hasta</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                  />
                </Form.Group>
              </Col>
              
              {!isDoctor && (
                <Col lg={2} md={4} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Doctor</Form.Label>
                    <Form.Select
                      name="doctorId"
                      value={filters.doctorId}
                      onChange={handleFilterChange}
                    >
                      <option value="">Todos</option>
                      {doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.user?.fullName || `Doctor ID: ${doctor.id}`}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              
              {isAdmin && (
                <Col lg={2} md={4} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label>Sector</Form.Label>
                    <Form.Select
                      name="sectorId"
                      value={filters.sectorId}
                      onChange={handleFilterChange}
                    >
                      <option value="">Todos</option>
                      {sectors.map(sector => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              
              <Col lg={2} md={4} sm={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Estado</Form.Label>
                  <Form.Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todos</option>
                    <option value="scheduled">Programada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="no_show">No asistió</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col lg={2} md={4} sm={12} className="d-flex align-items-end mb-3">
                <div className="d-grid gap-2 w-100">
                  <Button variant="primary" type="submit">
                    <i className="bi bi-search me-2"></i>
                    Filtrar
                  </Button>
                </div>
              </Col>
              
              <Col lg={2} md={4} sm={12} className="d-flex align-items-end mb-3">
                <div className="d-grid gap-2 w-100">
                  <Button variant="outline-secondary" type="button" onClick={handleResetFilters}>
                    <i className="bi bi-x-circle me-2"></i>
                    Limpiar
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
            {/* Tabla de citas */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Cargando citas...</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="table-responsive">
              <Table hover>
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Paciente</th>
                    {!isDoctor && <th>Doctor</th>}
                    {isAdmin && <th>Sector</th>}
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>{formatDate(appointment.date)}</td>
                      <td>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</td>
                      <td>{appointment.patient?.fullName || 'Paciente no disponible'}</td>
                      {!isDoctor && (
                        <td>
                          {appointment.doctor?.user?.fullName || 
                           appointment.doctor?.userId ? `Doctor ID: ${appointment.doctor.userId}` : 
                           'Doctor no disponible'}
                        </td>
                      )}
                      {isAdmin && (
                        <td>
                          {appointment.doctor?.sector?.name || 'No asignado'}
                        </td>
                      )}
                      <td>{getStatusBadge(appointment.status)}</td>                      <td className="text-nowrap">
                        <div className="d-flex align-items-center">
                          <Button
                            as={Link}
                            to={`/appointments/edit/${appointment.id}`}
                            variant="outline-primary"
                            size="sm"
                            className="me-2 d-flex align-items-center"
                            title="Editar cita"
                          >
                            <i className="bi bi-pencil-fill"></i>
                            <span className="d-none d-md-inline ms-1">Editar</span>
                          </Button>
                          
                          {(isAdmin || (
                            appointment.status === 'scheduled' && 
                            new Date(appointment.date) > new Date()
                          )) && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="d-flex align-items-center"
                              onClick={() => confirmDelete(appointment)}
                              title="Eliminar cita"
                            >
                              <i className="bi bi-trash-fill"></i>
                              <span className="d-none d-md-inline ms-1">Eliminar</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-calendar-x display-1 text-muted"></i>
              <p className="mt-3 lead">No se encontraron citas con los filtros seleccionados</p>
              <Button variant="primary" onClick={handleResetFilters}>
                Mostrar todas las citas
              </Button>
            </div>
          )}
          
          {/* Paginación */}
          {appointments.length > 0 && totalPages > 1 && renderPagination()}
        </Card.Body>
      </Card>
      
      {/* Modal de confirmación de eliminación */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {appointmentToDelete && (
            <>
              <p>¿Está seguro que desea eliminar esta cita?</p>
              <p>
                <strong>Fecha:</strong> {formatDate(appointmentToDelete.date)}<br />
                <strong>Paciente:</strong> {appointmentToDelete.patient?.fullName || 'No disponible'}<br />
                {!isDoctor && (
                  <>
                    <strong>Doctor:</strong> {appointmentToDelete.doctor?.user?.fullName || 'No disponible'}<br />
                  </>
                )}
                <strong>Estado:</strong> {appointmentToDelete.status === 'scheduled' ? 'Programada' : 
                                       appointmentToDelete.status === 'completed' ? 'Completada' :
                                       appointmentToDelete.status === 'cancelled' ? 'Cancelada' : 'No asistió'}
              </p>
              <Alert variant="warning">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Esta acción no se puede deshacer
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={deleteAppointment} disabled={loading}>
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Eliminando...
              </>
            ) : (
              <>Eliminar</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Appointments;
