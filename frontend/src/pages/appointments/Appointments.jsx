import { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Table, Form, Button, Badge, Pagination, Alert, Spinner, Modal } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContextValue';
import { AppointmentService, DoctorService, SectorService, SpecialtyService } from '../../utils/api'; // Asegúrate de que SpecialtyService esté importado
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Select from 'react-select';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './Appointments.css';

const Appointments = () => {
  const { user, isAdmin, isSectorAdmin, isDoctor } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [specialties, setSpecialties] = useState([]); // Añadido estado para especialidades
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    prestadorId: '',
    status: '',
    sectorId: ''
  });
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

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // --- CORRECCIÓN APLICADA AQUÍ ---
        const [sectorsRes, doctorsRes, specialtiesRes] = await Promise.all([
            SectorService.getAll({ params: { size: 1000 } }),
            DoctorService.getAll(),
            SpecialtyService.getAll({ params: { size: 1000 } })
        ]);

        setSectors(sectorsRes.data.items || []);
        setDoctors(doctorsRes.data || []);
        setSpecialties(specialtiesRes.data.items || []);
        // --- FIN DE LA CORRECCIÓN ---

        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const defaultFilters = {
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          prestadorId: '',
          status: '',
          sectorId: ''
        };
        setFilters(defaultFilters);
        await fetchAppointments(1, defaultFilters);
      } catch (err) {
        setError('Error al cargar los datos iniciales');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchAppointments = async (page = 1, customFilters = null) => {
    setLoading(true);
    setError('');
    try {
      const params = { ...(customFilters || filters), page, limit: itemsPerPage };
      let response;
      if (isDoctor && user.prestadorId) {
        response = await AppointmentService.getPrestadorAppointments(user.prestadorId, params);
      } else {
        if (isSectorAdmin && user.role === 'sector_admin' && user.sectorId) {
          params.sectorId = user.sectorId;
        }
        response = await AppointmentService.getFiltered(params);
      }
      const { data, pagination } = response.data;
      setAppointments(Array.isArray(data) ? data : []);
      if (pagination) {
        setTotalPages(pagination.totalPages > 0 ? pagination.totalPages : 1);
        setCurrentPage(pagination.currentPage || 1);
      } else {
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err) {
      setError('Error al cargar las citas. Por favor, intente de nuevo.');
      setAppointments([]);
      setTotalPages(1);
      setCurrentPage(1);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
      setError('La fecha de inicio no puede ser posterior a la fecha final');
      return;
    }
    setCurrentPage(1);
    fetchAppointments(1);
    setError('');
  };

  const handleResetFilters = () => {
    const reset = { startDate: '', endDate: '', prestadorId: '', status: '', sectorId: '' };
    setFilters(reset);
    setCurrentPage(1);
    fetchAppointments(1, reset);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchAppointments(page);
  };

  const confirmDelete = (appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };

  const deleteAppointment = async () => {
    try {
      setLoading(true);
      await AppointmentService.delete(appointmentToDelete.id);
      setSuccess(`Cita eliminada correctamente`);
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
      const nextPage = appointments.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      fetchAppointments(nextPage);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error al eliminar la cita');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return dateStr;
      return format(date, 'EEEE, dd MMMM yyyy', { locale: es });
    } catch (error) {
      return dateStr;
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled': return <Badge bg="primary" className="appointments-status-badge">Programada</Badge>;
      case 'completed': return <Badge bg="success" className="appointments-status-badge">Completada</Badge>;
      case 'cancelled': return <Badge bg="danger" className="appointments-status-badge">Cancelada</Badge>;
      case 'no_show': return <Badge bg="warning" className="appointments-status-badge">No asistió</Badge>;
      default: return <Badge bg="secondary" className="appointments-status-badge">Desconocido</Badge>;
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const items = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    items.push(<Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1} />);
    items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />);
    if (startPage > 1) { items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />); }
    for (let i = startPage; i <= endPage; i++) {
      items.push(<Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageChange(i)}>{i}</Pagination.Item>);
    }
    if (endPage < totalPages) { items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />); }
    items.push(<Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />);
    items.push(<Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />);
    return (
      <div className="d-flex flex-column align-items-center mt-4">
        <Pagination size="lg">{items}</Pagination>
        <div className="text-muted mt-2">Página {currentPage} de {totalPages}{" "}{appointments.length > 0 ? `(Mostrando ${appointments.length} citas)` : ""}</div>
      </div>
    );
  };

  return (
    <div className="w-100">
      <Card className="appointments-card w-100 border-0 mb-4 py-4">
        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
          <h4 className="mb-0">
            <i className="bi bi-calendar2-week-fill me-2" style={{ color: "#275950" }}></i>
            Gestión de Citas
          </h4>
          <Button as={Link} to="/appointments/add" variant="success" className="d-flex align-items-center">
            <i className="bi bi-plus-circle me-2"></i>
            Nueva Cita
          </Button>
        </Card.Header>
        <Card.Body>
          {success && (<Alert variant="success" dismissible onClose={() => setSuccess('')}><i className="bi bi-check-circle-fill me-2"></i>{success}</Alert>)}
          {error && (<Alert variant="danger" dismissible onClose={() => setError('')}><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</Alert>)}
          <Form onSubmit={handleApplyFilters} className="mb-4">
            <Row>
              <Col lg={2} md={4} sm={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="appointments-filter-label"><i className="bi bi-calendar-date me-1"></i>Desde</Form.Label>
                  <Form.Control type="date" name="startDate" value={filters.startDate} onChange={(e) => handleFilterChange(e.target.name, e.target.value)} className="appointments-filter-select" />
                </Form.Group>
              </Col>
              <Col lg={2} md={4} sm={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="appointments-filter-label"><i className="bi bi-calendar-date me-1"></i>Hasta</Form.Label>
                  <Form.Control type="date" name="endDate" value={filters.endDate} onChange={(e) => handleFilterChange(e.target.name, e.target.value)} className="appointments-filter-select" />
                </Form.Group>
              </Col>
              {!isDoctor && (
                <Col lg={2} md={4} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="appointments-filter-label"><i className="bi bi-person-badge me-1"></i>Doctor</Form.Label>
                    <Select
                        classNamePrefix="custom-select"
                        className="custom-select-container"
                        options={doctors.map(doctor => ({ value: doctor.id, label: doctor.user?.fullName || `Doctor ID: ${doctor.id}` }))}
                        onChange={selectedOption => handleFilterChange('prestadorId', selectedOption ? selectedOption.value : '')}
                        value={doctors.map(d => ({ value: d.id, label: d.user?.fullName })).find(d => String(d.value) === String(filters.prestadorId)) || null}
                        isClearable
                        isSearchable
                        placeholder="Todos"
                    />
                  </Form.Group>
                </Col>
              )}
              {isAdmin && (
                <Col lg={2} md={4} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="appointments-filter-label"><i className="bi bi-diagram-3 me-1"></i>Sector</Form.Label>
                    <Form.Select name="sectorId" value={filters.sectorId} onChange={(e) => handleFilterChange(e.target.name, e.target.value)} className="appointments-filter-select">
                      <option value="">Todos</option>
                      {sectors.map(sector => (<option key={sector.id} value={sector.id}>{sector.name}</option>))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              <Col lg={2} md={4} sm={6} className="mb-3">
                <Form.Group>
                  <Form.Label className="appointments-filter-label"><i className="bi bi-info-circle me-1"></i>Estado</Form.Label>
                  <Form.Select name="status" value={filters.status} onChange={(e) => handleFilterChange(e.target.name, e.target.value)} className="appointments-filter-select">
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
                  <Button variant="primary" type="submit" className="btn-primary-custom d-flex align-items-center justify-content-center"><i className="bi bi-search me-2"></i>Filtrar</Button>
                </div>
              </Col>
              <Col lg={2} md={4} sm={12} className="d-flex align-items-end mb-3">
                <div className="d-grid gap-2 w-100">
                  <Button variant="outline-secondary" type="button" onClick={handleResetFilters} className="btn-limpiar d-flex align-items-center justify-content-center"><i className="bi bi-x-circle me-2"></i>Limpiar</Button>
                </div>
              </Col>
            </Row>
          </Form>
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" style={{ color: "#275950" }} /><p className="mt-3" style={{ color: "#275950" }}>Cargando citas...</p></div>
          ) : appointments.length > 0 ? (
            <div className="table-responsive">
              <Table hover className="appointments-table">
                <thead><tr><th><i className="bi bi-calendar-event me-1" style={{ color: "#275950" }}></i>Fecha</th><th><i className="bi bi-clock me-1"></i>Hora</th><th><i className="bi bi-clipboard2-pulse me-1"></i>Servicio</th><th><i className="bi bi-person me-1"></i>Paciente</th>{!isDoctor && <th><i className="bi bi-person-badge me-1"></i>Doctor</th>}{isAdmin && <th><i className="bi bi-diagram-3 me-1"></i>Sector</th>}<th><i className="bi bi-info-circle me-1"></i>Estado</th><th><i className="bi bi-gear me-1"></i>Acciones</th></tr></thead>
                <tbody>
                  {appointments.map(appointment => (
                    <tr key={appointment.id}>
                      <td>{formatDate(appointment.date)}</td><td>{`${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`}</td><td>{appointment.servicio?.nombre_servicio || '-'}</td><td>{appointment.patient?.fullName || 'Paciente no disponible'}</td>
                      {!isDoctor && (<td>{appointment.prestador?.user?.fullName || (appointment.prestador?.userId ? `Prestador ID: ${appointment.prestador.userId}` : 'Prestador no disponible')}</td>)}
                      {isAdmin && (<td>{appointment.prestador?.sector?.name || 'No asignado'}</td>)}
                      <td>{getStatusBadge(appointment.status)}</td>
                      <td className="text-nowrap appointments-actions">
                        <div className="d-flex align-items-center">
                          <Button as={Link} to={`/appointments/edit/${appointment.id}`} variant="outline-primary" size="sm" className="me-2 d-flex align-items-center" title="Editar cita"><i className="bi bi-pencil-fill"></i><span className="d-none d-md-inline ms-1">Editar</span></Button>
                          {(isAdmin || (appointment.status === 'scheduled' && new Date(appointment.date) > new Date())) && (<Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={() => confirmDelete(appointment)} title="Eliminar cita"><i className="bi bi-trash-fill"></i><span className="d-none d-md-inline ms-1">Eliminar</span></Button>)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5 d-flex flex-column align-items-center">
                <i className="bi bi-calendar-x appointments-empty-icon"></i>
                <p className="mt-3 lead">No se encontraron citas con los filtros seleccionados</p>
                <Button 
                  onClick={handleResetFilters} 
                  className="d-flex align-items-center btn-primary-custom"
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>Mostrar todas las citas
                </Button>
            </div>
          )}
          {totalPages > 1 && renderPagination()}
        </Card.Body>
      </Card>
      
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton><Modal.Title><i className="bi bi-trash3-fill text-danger me-2"></i>Confirmar eliminación</Modal.Title></Modal.Header>
        <Modal.Body>
          {appointmentToDelete && (
            <>
              <p>¿Está seguro que desea eliminar esta cita?</p>
              <p><strong>Fecha:</strong> {formatDate(appointmentToDelete.date)}<br /><strong>Paciente:</strong> {appointmentToDelete.patient?.fullName || 'No disponible'}<br />
                {!isDoctor && (<><strong>Doctor:</strong> {appointmentToDelete.prestador?.user?.fullName || 'No disponible'}<br /></>)}
                <strong>Estado:</strong> {appointmentToDelete.status === 'scheduled' ? 'Programada' : appointmentToDelete.status === 'completed' ? 'Completada' : appointmentToDelete.status === 'cancelled' ? 'Cancelada' : 'No asistió'}
              </p>
              <Alert variant="warning"><i className="bi bi-exclamation-triangle-fill me-2"></i>Esta acción no se puede deshacer</Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}><i className="bi bi-x-lg me-1"></i>Cancelar</Button>
          <Button variant="danger" onClick={deleteAppointment} disabled={loading}>{loading ? (<><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Eliminando...</>) : (<><i className="bi bi-trash3-fill me-1"></i>Eliminar</>)}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Appointments;