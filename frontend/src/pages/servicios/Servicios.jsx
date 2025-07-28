import { useEffect, useState, useCallback } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Spinner, InputGroup, Pagination } from 'react-bootstrap';
import ServicioService from '../../services/ServicioService';
import styles from './Servicios.module.css';
import '../Appointments/Appointments.css'; // Reutilizamos el CSS para un estilo consistente

const formatNumber = (num) => {
  if (num === null || num === undefined) return '';
  return new Intl.NumberFormat('es-ES').format(num);
};

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState({ type: null, data: null });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Cada nueva búsqueda resetea a la página 1
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchServicios = async () => {
      setLoading(true);
      try {
        const res = await ServicioService.getAll(page, 10, debouncedSearchTerm);
        setServicios(res.data.items);
        setTotalPages(res.data.totalPages);
        setError('');
      } catch (err) {
        setError('Error al cargar los servicios. Verifique la conexión con el servidor.');
        setServicios([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServicios();
  }, [page, debouncedSearchTerm]);

  const refreshData = async () => {
    const res = await ServicioService.getAll(page, 10, debouncedSearchTerm);
    setServicios(res.data.items);
    setTotalPages(res.data.totalPages);
  };
  
  const showFlashMessage = (setter, message) => {
    setter(message);
    setTimeout(() => setter(''), 4000);
  };

  const handleSave = async (formData) => {
    const isEditing = !!modal.data;
    try {
      if (isEditing) {
        await ServicioService.update(modal.data.id, formData);
      } else {
        await ServicioService.create(formData);
      }
      showFlashMessage(setSuccess, `Servicio ${isEditing ? 'actualizado' : 'creado'} correctamente.`);
      refreshData();
    } catch (err) {
      const errorMessage = err.response?.data?.error || `Error al ${isEditing ? 'actualizar' : 'crear'} el servicio.`;
      throw new Error(errorMessage);
    }
  };

  const handleDelete = async () => {
    try {
      await ServicioService.delete(modal.data.id);
      showFlashMessage(setSuccess, 'Servicio eliminado correctamente.');
      refreshData();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al eliminar el servicio.';
      throw new Error(errorMessage);
    }
  };

  return (
    <Container className="py-4">
      <Card className={styles.servicioCard}>
        <Card.Header className={styles.cardHeader}>
          <h2>Gestión de Servicios</h2>
          <Button className={styles.primaryButton} onClick={() => setModal({ type: 'edit', data: null })}>
            <i className="bi bi-plus-circle me-2"></i>Nuevo Servicio
          </Button>
        </Card.Header>
        <Card.Body className="p-4">
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          {error && !loading && <Alert variant="danger">{error}</Alert>}
          
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Buscar por nombre de servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
          </InputGroup>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" style={{ color: '#275950' }} /></div>
          ) : (
            <>
              <Table responsive hover className={styles.servicioTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre del Servicio</th>
                    <th>Precio</th>
                    <th>Tiempo (min)</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {servicios.map(servicio => (
                    <tr key={servicio.id}>
                      <td>{servicio.id}</td>
                      <td>{servicio.nombre_servicio}</td>
                      <td>{formatNumber(servicio.precio)}</td>
                      <td>{servicio.tiempo} min</td>
                      <td className={`text-center ${styles.actionButtons}`}>
                          <Button size="sm" variant="warning" className="me-2" onClick={() => setModal({ type: 'edit', data: servicio })}>
                              <i className="bi bi-pencil-fill"></i> Editar
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setModal({ type: 'delete', data: servicio })}>
                              <i className="bi bi-trash-fill"></i> Eliminar
                          </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </Card.Body>
      </Card>

      <FormModal
        show={modal.type === 'edit'}
        onHide={() => setModal({ type: null, data: null })}
        title={modal.data ? 'Editar Servicio' : 'Nuevo Servicio'}
        initialData={modal.data}
        onSubmit={handleSave}
      />

      <DeleteModal
        show={modal.type === 'delete'}
        onHide={() => setModal({ type: null, data: null })}
        onConfirm={handleDelete}
        item={modal.data?.nombre_servicio}
      />
    </Container>
  );
};

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const pageNumbers = [];
  const maxPagesToShow = 5;
  let startPage, endPage;

  if (totalPages <= maxPagesToShow) {
    startPage = 1;
    endPage = totalPages;
  } else {
    const maxPagesBefore = Math.floor(maxPagesToShow / 2);
    const maxPagesAfter = Math.ceil(maxPagesToShow / 2) - 1;
    if (currentPage <= maxPagesBefore) {
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + maxPagesAfter >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - maxPagesBefore;
      endPage = currentPage + maxPagesAfter;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="d-flex justify-content-center">
      <Pagination>
        <Pagination.First onClick={() => handlePageClick(1)} disabled={currentPage === 1} />
        <Pagination.Prev onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1} />
        {startPage > 1 && <Pagination.Ellipsis disabled />}
        {pageNumbers.map(number => (
          <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageClick(number)}>
            {number}
          </Pagination.Item>
        ))}
        {endPage < totalPages && <Pagination.Ellipsis disabled />}
        <Pagination.Next onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage === totalPages} />
        <Pagination.Last onClick={() => handlePageClick(totalPages)} disabled={currentPage === totalPages} />
      </Pagination>
    </div>
  );
};

const FormModal = ({ show, onHide, title, initialData, onSubmit }) => {
  const [formData, setFormData] = useState({});
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (show) {
      setFormData(initialData || { nombre_servicio: '', precio: '', tiempo: '' });
      setLocalError('');
    }
  }, [show, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.nombre_servicio || !formData.precio || !formData.tiempo) {
      setLocalError('Todos los campos son obligatorios.');
      return;
    }
    try {
      await onSubmit(formData);
      onHide();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {localError && <Alert variant="danger">{localError}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label className={styles.formLabel}>Nombre del Servicio</Form.Label>
          <Form.Control name="nombre_servicio" value={formData.nombre_servicio || ''} onChange={handleChange} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label className={styles.formLabel}>Precio</Form.Label>
          <Form.Control type="number" name="precio" value={formData.precio || ''} onChange={handleChange} />
        </Form.Group>
        <Form.Group>
          <Form.Label className={styles.formLabel}>Tiempo (en minutos)</Form.Label>
          <Form.Control type="number" name="tiempo" value={formData.tiempo || ''} onChange={handleChange} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancelar</Button>
        <Button className={styles.primaryButton} onClick={handleSave}>Guardar</Button>
      </Modal.Footer>
    </Modal>
  );
};

const DeleteModal = ({ show, onHide, onConfirm, item }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setLoading(true);
        setError('');
        try {
            await onConfirm();
            onHide();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title><i className="bi bi-trash3-fill text-danger me-2"></i>Confirmar Eliminación</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                ¿Estás seguro que deseas eliminar el servicio <strong>{item}</strong>?
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>Cancelar</Button>
                <Button variant="danger" onClick={handleDelete} disabled={loading}>
                    {loading ? <Spinner as="span" size="sm" /> : 'Eliminar'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default Servicios;