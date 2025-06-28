import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Table, Form, Button, Badge, Pagination, Alert, Spinner, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContextValue';
import { AppointmentService, DoctorService, SectorService } from '../../utils/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Appointments = () => {
  const { user, isAdmin, isSectorAdmin, isDoctor } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [sectors, setSectors] = useState([]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    prestadorId: '',
    status: '',
    sectorId: ''
  });

  // Modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Sectores
        if (isSectorAdmin && !isDoctor) {
          try {
            const sectorsResponse = await SectorService.getAll();
            setSectors(sectorsResponse.data);
          } catch (err) {
            console.error('Error al cargar sectores:', err);
          }
        }
        // Doctores
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
        // Fechas por defecto (últimos 30 días)
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setFilters({
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          prestadorId: '',
          status: '',
          sectorId: ''
        });
        await fetchAppointments(1, {
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          prestadorId: '',
          status: '',
          sectorId: ''
        });
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

  // Cargar citas con filtros y página
  const fetchAppointments = async (page = 1, customFilters = null) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        ...(customFilters || filters),
        page,
        limit: itemsPerPage
      };
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

  // Cambios en los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
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
    setCurrentPage(1);
    fetchAppointments(1);
    setError('');
  };

  // Resetear filtros (sin fechas por defecto)
  const handleResetFilters = () => {
    const reset = {
      startDate: '',
      endDate: '',
      prestadorId: '',
      status: '',
      sectorId: ''
    };
    setFilters(reset);
    setCurrentPage(1);
    fetchAppointments(1, reset);
  };

  // Cambiar de página
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchAppointments(page);
  };

  // Modal de eliminación
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
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
      // Si era la última cita de la página y no es la primera, retrocede una página
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

  // Formatear fecha
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

  // Formatear hora
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  // Etiqueta de estado
  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge bg="primary" className="appointments-status-badge">Programada</Badge>;
      case 'completed':
        return <Badge bg="success" className="appointments-status-badge">Completada</Badge>;
      case 'cancelled':
        return <Badge bg="danger" className="appointments-status-badge">Cancelada</Badge>;
      case 'no_show':
        return <Badge bg="warning" className="appointments-status-badge">No asistió</Badge>;
      default:
        return <Badge bg="secondary" className="appointments-status-badge">Desconocido</Badge>;
    }
  };

  // Renderizar paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const items = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    items.push(
      <Pagination.First
        key="first"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
      />
    );
    items.push(
      <Pagination.Prev
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />
    );
    if (startPage > 1) {
      items.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
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
    if (endPage < totalPages) {
      items.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
    }
    items.push(
      <Pagination.Next
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    );
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
          Página {currentPage} de {totalPages}{" "}
          {appointments.length > 0 ? `(Mostrando ${appointments.length} citas)` : ""}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Estilos personalizados para la sección de citas */}
      <style>{`
        .appointments-card {
          background: #fff;
          border-radius: 1rem;
          padding: 2rem 1.5rem;
        }
        .appointments-table th, .appointments-table td {
          vertical-align: middle !important;
        }
        .appointments-table th {
          background: #e0f7fa !important;
          color: #275950;
          font-weight: 600;
        }
        .appointments-table tbody tr:hover {
          background: #e0f2f1 !important;
        }
        .appointments-badge {
          font-size: 1rem;
          padding: 0.5em 1em;
          border-radius: 1rem;
        }
        .appointments-actions .btn {
          border-radius: 1rem;
          transition: box-shadow 0.2s;
        }
        .appointments-actions .btn:hover {
          box-shadow: 0 2px 8px rgba(65, 191, 179, 0.10);
        }
        .appointments-empty-icon {
          font-size: 4rem;
          color: #b2dfdb;
        }
        .appointments-filter-label {
          color: #2A8C82;
          font-weight: 500;
        }
        /* Mejorar los select de filtros */
        .appointments-filter-select {
          border-color: #275950 !important;
          background: #f8fafb !important;
          color: #275950 !important;
          font-weight: 500;
          box-shadow: none !important;
          padding-left: 1.2rem !important;
          padding-right: 2rem !important;
          min-height: 2.5rem;
        }
        .appointments-filter-select:focus {
          border-color: #1d403a !important;
          box-shadow: 0 0 0 0.2rem rgba(39, 89, 80, 0.15) !important;
          background: #e0f7fa !important;
        }
        /* Botón azul personalizado */
        .btn-azul {
          background-color: #275950 !important;
          border-color: #275950 !important;
          color: #fff !important;
        }
        .btn-azul:hover, .btn-azul:focus {
          background-color: #1d403a !important;
          border-color: #1d403a !important;
          color: #fff !important;
        }
        /* Botón limpiar personalizado */
        .btn-limpiar {
          background: #fff !important;
          border: 2px solid #275950 !important;
          color: #275950 !important;
          border-radius: 1.5rem !important;
          font-weight: 500;
          transition: background 0.2s, color 0.2s, border 0.2s;
        }
        .btn-limpiar:hover, .btn-limpiar:focus {
          background: #275950 !important;
          color: #fff !important;
          border-color: #1d403a !important;
        }
        /* Paginación personalizada */
        .pagination .page-link {
          color: #275950 !important;
          border-radius: 0.75rem !important;
          border: 1.5px solid #b2dfdb !important;
          background: #fff !important;
          font-weight: 600;
          transition: background 0.2s, color 0.2s, border 0.2s;
        }
        .pagination .page-item.active .page-link {
          background: #275950 !important;
          color: #fff !important;
          border-color: #275950 !important;
        }
        .pagination .page-link:hover, 
        .pagination .page-item:not(.active):hover .page-link {
          background: #e0f7fa !important;
          color: #275950 !important;
          border-color: #275950 !important;
        }
        .pagination .page-item.disabled .page-link {
          color: #b2dfdb !important;
          background: #fff !important;
          border-color: #b2dfdb !important;
        }
        .pagination .page-link:focus {
          box-shadow: 0 0 0 0.2rem rgba(39, 89, 80, 0.25) !important;
          outline: none !important;
        }
        .appointments-status-badge {
          font-size: 0.8rem;
          padding: 0.53em 0.6em;
          border-radius: 1.5rem;
          font-weight: 500;}
      `}</style>
      
      <div className="w-100">
        <Card className="appointments-card w-100 border-0 mb-4 py-4">
          <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <i className="bi bi-calendar2-week-fill me-2" style={{ color: "#275950" }}></i>
              Gestión de Citas
            </h4>
            <Button
              as={Link}
              to="/appointments/add"
              variant="success"
              className="d-flex align-items-center"
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
                <i className="bi bi-check-circle-fill me-2"></i>
                {success}
              </Alert>
            )}
            {error && (
              <Alert
                variant="danger"
                dismissible
                onClose={() => setError('')}
              >
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </Alert>
            )}
            {/* Filtros */}
            <Form onSubmit={handleApplyFilters} className="mb-4">
              <Row>
                <Col lg={2} md={4} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="appointments-filter-label">
                      <i className="bi bi-calendar-date me-1"></i>Desde
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                      className="appointments-filter-select"
                    />
                  </Form.Group>
                </Col>
                <Col lg={2} md={4} sm={6} className="mb-3">
                  <Form.Group>
                    <Form.Label className="appointments-filter-label">
                      <i className="bi bi-calendar-date me-1"></i>Hasta
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={filters.endDate}
                      onChange={handleFilterChange}
                      className="appointments-filter-select"
                    />
                  </Form.Group>
                </Col>
                {!isDoctor && (
                  <Col lg={2} md={4} sm={6} className="mb-3">
                    <Form.Group>
                      <Form.Label className="appointments-filter-label">
                        <i className="bi bi-person-badge me-1"></i>Doctor
                      </Form.Label>
                      <Form.Select
                        name="prestadorId"
                        value={filters.prestadorId}
                        onChange={handleFilterChange}
                        className="appointments-filter-select"
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
                      <Form.Label className="appointments-filter-label">
                        <i className="bi bi-diagram-3 me-1"></i>Sector
                      </Form.Label>
                      <Form.Select
                        name="sectorId"
                        value={filters.sectorId}
                        onChange={handleFilterChange}
                        className="appointments-filter-select"
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
                    <Form.Label className="appointments-filter-label">
                      <i className="bi bi-info-circle me-1"></i>Estado
                    </Form.Label>
                    <Form.Select
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="appointments-filter-select"
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
                    <Button variant="primary" type="submit" className="btn-azul d-flex align-items-center">
                      <i className="bi bi-search me-2"></i>
                      Filtrar
                    </Button>
                  </div>
                </Col>
                <Col lg={2} md={4} sm={12} className="d-flex align-items-end mb-3">
                  <div className="d-grid gap-2 w-100">
                    <Button
                      variant="outline-secondary"
                      type="button"
                      onClick={handleResetFilters}
                      className="btn-limpiar d-flex align-items-center"
                    >
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
                <Spinner animation="border" style={{ color: "#275950" }} />
                <p className="mt-3" style={{ color: "#275950" }}>Cargando citas...</p>
              </div>
            ) : appointments.length > 0 ? (
              <div className="table-responsive">
                <Table hover className="appointments-table">
                  <thead>
                    <tr>
                      <th><i className="bi bi-calendar-event me-1" style={{ color: "#275950" }}></i>Fecha</th>
                      <th><i className="bi bi-clock me-1"></i>Hora</th>
                      <th><i className="bi bi-clipboard2-pulse me-1"></i>Servicio</th>
                      <th><i className="bi bi-person me-1"></i>Paciente</th>
                      {!isDoctor && <th><i className="bi bi-person-badge me-1"></i>Doctor</th>}
                      {isAdmin && <th><i className="bi bi-diagram-3 me-1"></i>Sector</th>}
                      <th><i className="bi bi-info-circle me-1"></i>Estado</th>
                      <th><i className="bi bi-gear me-1"></i>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map(appointment => (
                      <tr key={appointment.id}>
                        <td>{formatDate(appointment.date)}</td>
                        <td>{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</td>
                        <td>{appointment.servicio?.nombre_servicio || '-'}</td>
                        <td>{appointment.patient?.fullName || 'Paciente no disponible'}</td>
                        {!isDoctor && (
                          <td>
                            {appointment.prestador?.user?.fullName ||
                              (appointment.prestador?.userId ? `Prestador ID: ${appointment.prestador.userId}` :
                                'Prestador no disponible')}
                          </td>
                        )}
                        {isAdmin && (
                          <td>
                            {appointment.prestador?.sector?.name || 'No asignado'}
                          </td>
                        )}
                        <td>{getStatusBadge(appointment.status)}</td>
                        <td className="text-nowrap appointments-actions">
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
                <i className="bi bi-calendar-x appointments-empty-icon"></i>
                <p className="mt-3 lead">No se encontraron citas con los filtros seleccionados</p>
                <Button variant="primary" onClick={handleResetFilters} className="d-flex align-items-center">
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Mostrar todas las citas
                </Button>
              </div>
            )}
            {/* Paginación */}
            {totalPages > 1 && renderPagination()}
          </Card.Body>
        </Card>
        {/* Modal de confirmación de eliminación */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-trash3-fill text-danger me-2"></i>
              Confirmar eliminación
            </Modal.Title>
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
                      <strong>Doctor:</strong> {appointmentToDelete.prestador?.user?.fullName || 'No disponible'}<br />
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
              <i className="bi bi-x-lg me-1"></i>
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
                <>
                  <i className="bi bi-trash3-fill me-1"></i>
                  Eliminar
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default Appointments;