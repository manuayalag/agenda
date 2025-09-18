import { useState, useEffect, useContext, useCallback } from 'react';
import { Row, Col, Card, Table, Form, Button, Badge, Pagination, Alert, Spinner, Modal, Accordion, InputGroup, Dropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContextValue';
import { AppointmentService, DoctorService, SectorService } from '../../utils/api';
import ServicioService from '../../services/ServicioService'; 
import { format, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import Select from 'react-select';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Appointments.css';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
};

const Appointments = () => {
  const { user, isAdmin, isSectorAdmin, isDoctor } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [doctors, setDoctors] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [services, setServices] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [filters, setFilters] = useState({
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
    prestadorId: '',
    status: '',
    sectorId: '',
    patientSearch: '',
    servicioId: ''
  });

  const debouncedPatientSearch = useDebounce(filters.patientSearch, 500);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
      navigate(location.pathname, { replace: true, state: {} });
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [sectorsRes, doctorsRes, servicesRes] = await Promise.all([
          SectorService.getAll({ params: { size: 1000 } }),
          DoctorService.getAll(),
          ServicioService.getAll(1, 1000)
      ]);
      setSectors(sectorsRes.data.items || []);
      setDoctors(doctorsRes.data || []);
      setServices(servicesRes.data.items || []);
    } catch (err) {
      setError('Error al cargar datos para filtros');
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchAppointments = useCallback(async (page) => {
    setLoading(true);
    setError('');
    try {
      let params = { ...filters, page, limit: itemsPerPage, patientSearch: debouncedPatientSearch };
      
      if (isDoctor && user.prestadorId) {
        params.prestadorId = user.prestadorId;
      } else if (isSectorAdmin && !isAdmin && user.sectorId) {
        params.sectorId = user.sectorId;
      }
      
      Object.keys(params).forEach(key => (params[key] === '' || params[key] === null || params[key] === undefined) && delete params[key]);

      const response = await AppointmentService.getFiltered(params);
      const { data, pagination } = response.data;
      setAppointments(Array.isArray(data) ? data : []);
      setTotalPages(pagination?.totalPages > 0 ? pagination.totalPages : 1);
      setCurrentPage(pagination?.currentPage || 1);
    } catch (err) {
      setError('Error al cargar las citas.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [filters, isDoctor, isAdmin, isSectorAdmin, user, debouncedPatientSearch, itemsPerPage]);
  
  useEffect(() => {
    fetchAppointments(currentPage);
  }, [currentPage]);

  useEffect(() => {
      if (currentPage !== 1) {
          setCurrentPage(1);
      } else {
          fetchAppointments(1);
      }
  }, [debouncedPatientSearch]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleApplyFilters = () => {
    if (currentPage === 1) {
        fetchAppointments(1);
    } else {
        setCurrentPage(1);
    }
  };
  
  const handleResetFilters = () => {
    const newFilters = {
        startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
        endDate: format(addMonths(new Date(), 1), 'yyyy-MM-dd'),
        prestadorId: '', status: '', sectorId: '', patientSearch: '', servicioId: ''
    };
    setFilters(newFilters);
    if (currentPage === 1) {
      fetchAppointments(1);
    } else {
      setCurrentPage(1);
    }
  };
  
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    const originalAppointments = [...appointments];
    setAppointments(prev => prev.map(app => app.id === appointmentId ? { ...app, status: newStatus } : app));
    
    try {
        await AppointmentService.update(appointmentId, { status: newStatus });
        setSuccess('Estado actualizado con éxito.');
        setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
        setError('Error al actualizar el estado.');
        setAppointments(originalAppointments);
    }
  };

  const confirmDelete = (appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };

  const deleteAppointment = async () => {
    if (!appointmentToDelete) return;
    try {
      await AppointmentService.delete(appointmentToDelete.id);
      setSuccess(`Cita eliminada correctamente`);
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
      fetchAppointments(currentPage);
    } catch (err) {
      setError('Error al eliminar la cita');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00Z');
    return format(date, 'EEEE, dd MMMM yyyy', { locale: es });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };
  
  const getStatusBadge = (status) => {
    const statuses = {
      scheduled: { bg: 'primary', text: 'Programada' },
      completed: { bg: 'success', text: 'Completada' },
      cancelled: { bg: 'danger', text: 'Cancelada' },
      no_show: { bg: 'warning', text: 'No Asistió' }
    };
    const { bg, text } = statuses[status] || { bg: 'secondary', text: 'Desconocido' };
    return <Badge bg={bg} className="appointments-status-badge">{text}</Badge>;
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    let items = [];
    // Simple pagination for brevity
    for (let number = 1; number <= totalPages; number++) {
        items.push(<Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>{number}</Pagination.Item>);
    }
    return (
        <div className="d-flex justify-content-center mt-4">
            <Pagination>
                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                {items}
                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
            </Pagination>
        </div>
    );
  };

  return (
    <div className="w-100">
      <Card className="appointments-card w-100 border-0 mb-4 py-4">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
          <h4 className="mb-0"><i className="bi bi-calendar2-week-fill me-2" style={{ color: "#275950" }}></i>Gestión de Citas</h4>
          <Button as={Link} to="/appointments/add" variant="success" className="d-flex align-items-center"><i className="bi bi-plus-circle me-2"></i>Nueva Cita</Button>
        </Card.Header>
        <Card.Body>
          {success && (<Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>)}
          {error && (<Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>)}
          
          <Accordion className="mb-4">
            <Accordion.Item eventKey="0">
              <Accordion.Header><i className="bi bi-funnel-fill me-2"></i>Filtros de Búsqueda</Accordion.Header>
              <Accordion.Body>
                <Form>
                  <Row>
                    <Col lg={4} md={6} sm={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Rango de Fechas</Form.Label>
                        <div className="d-flex align-items-center">
                          <Form.Control type="date" name="startDate" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="me-2" />
                          <span>-</span>
                          <Form.Control type="date" name="endDate" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="ms-2" />
                        </div>
                      </Form.Group>
                    </Col>
                    {!isDoctor && (
                      <Col lg={4} md={6} sm={12} className="mb-3">
                        <Form.Group><Form.Label>Doctor</Form.Label><Select options={(doctors || []).map(d => ({ value: d.id, label: d.user.fullName }))} isClearable onChange={opt => handleFilterChange('prestadorId', opt ? opt.value : '')} /></Form.Group>
                      </Col>
                    )}
                     {isAdmin && (
                      <Col lg={4} md={6} sm={12} className="mb-3">
                        <Form.Group><Form.Label>Sector</Form.Label><Select options={(sectors || []).map(s => ({ value: s.id, label: s.name }))} isClearable onChange={opt => handleFilterChange('sectorId', opt ? opt.value : '')} /></Form.Group>
                      </Col>
                    )}
                    <Col lg={4} md={6} sm={12} className="mb-3">
                      <Form.Group><Form.Label>Servicio</Form.Label><Select options={(services || []).map(s => ({ value: s.id, label: s.nombre_servicio }))} isClearable onChange={opt => handleFilterChange('servicioId', opt ? opt.value : '')} /></Form.Group>
                    </Col>
                    <Col lg={4} md={6} sm={12} className="mb-3">
                      <Form.Group><Form.Label>Estado</Form.Label><Select options={[{ value: '', label: 'Todos' }, { value: 'scheduled', label: 'Programada' }, { value: 'completed', label: 'Completada' }, { value: 'cancelled', label: 'Cancelada' }, { value: 'no_show', label: 'No Asistió' }]} isClearable onChange={opt => handleFilterChange('status', opt ? opt.value : '')} /></Form.Group>
                    </Col>
                    <Col lg={4} md={6} sm={12} className="mb-3">
                        <Form.Group>
                          <Form.Label>Buscar Paciente</Form.Label>
                          <InputGroup>
                            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                            <Form.Control type="text" placeholder="Nombre o documento..." value={filters.patientSearch} onChange={(e) => handleFilterChange('patientSearch', e.target.value)}/>
                          </InputGroup>
                        </Form.Group>
                    </Col>
                  </Row>
                  <Button variant="primary" onClick={handleApplyFilters} className="me-2">Aplicar Filtros</Button>
                  <Button variant="outline-secondary" onClick={handleResetFilters}>Limpiar</Button>
                </Form>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>

          {loading ? ( <div className="text-center py-5"><Spinner animation="border"/></div> ) :
            appointments.length > 0 ? (
              <div className="table-responsive">
                <Table hover className="appointments-table">
                  <thead><tr><th>Fecha</th><th>Hora</th><th>Servicio</th><th>Paciente</th>{!isDoctor && <th>Doctor</th>}{isAdmin && <th>Sector</th>}<th>Estado</th><th>Acciones</th></tr></thead>
                  <tbody>
                    {appointments.map(app => (
                      <tr key={app.id}>
                        <td>{formatDate(app.date)}</td><td>{`${formatTime(app.startTime)} - ${formatTime(app.endTime)}`}</td><td>{app.servicio?.nombre_servicio || '-'}</td><td>{app.patient?.fullName || 'N/A'}</td>
                        {!isDoctor && (<td>{app.prestador?.user?.fullName || 'N/A'}</td>)}
                        {isAdmin && (<td>{app.prestador?.sector?.name || 'N/A'}</td>)}
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle as="span" style={{ cursor: 'pointer' }} id={`dropdown-status-${app.id}`}>{getStatusBadge(app.status)}</Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleStatusChange(app.id, 'scheduled')}>Programada</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleStatusChange(app.id, 'completed')}>Completada</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleStatusChange(app.id, 'cancelled')}>Cancelada</Dropdown.Item>
                              <Dropdown.Item onClick={() => handleStatusChange(app.id, 'no_show')}>No Asistió</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                        <td className="text-nowrap appointments-actions">
                          <Button as={Link} to={`/appointments/edit/${app.id}`} variant="outline-primary" size="sm" className="me-2" title="Editar cita"><i className="bi bi-pencil-fill"></i></Button>
                          {isAdmin && (<Button variant="outline-danger" size="sm" onClick={() => confirmDelete(app)} title="Eliminar cita"><i className="bi bi-trash-fill"></i></Button>)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : ( <div className="text-center py-5"><p className="lead">No se encontraron citas con los filtros seleccionados.</p></div> )
          }
          {renderPagination()}
        </Card.Body>
      </Card>
      
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
         <Modal.Header closeButton><Modal.Title>Confirmar Eliminación</Modal.Title></Modal.Header>
         <Modal.Body>¿Está seguro que desea eliminar la cita de <strong>{appointmentToDelete?.patient?.fullName}</strong>?</Modal.Body>
         <Modal.Footer>
           <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
           <Button variant="danger" onClick={deleteAppointment}>Eliminar</Button>
         </Modal.Footer>
       </Modal>
    </div>
  );
};

export default Appointments;