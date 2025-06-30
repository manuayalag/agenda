// frontend/src/pages/admin/specialties/Specialties.jsx
import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Modal, Form, InputGroup, Pagination, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Specialties.module.css';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const Specialties = () => {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchSpecialties = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/specialties', {
        params: { search: debouncedSearchTerm, page: currentPage, size: 10 }
      });
      setSpecialties(response.data.items || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      setError('Error al cargar especialidades');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => { fetchSpecialties(); }, [fetchSpecialties]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearchTerm]);

  const handleDeleteSpecialty = async () => {
    if (!specialtyToDelete) return;
    try {
      await api.delete(`/specialties/${specialtyToDelete.id}`);
      fetchSpecialties();
      setShowDeleteModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar la especialidad.');
    }
  };
  
  return (
    <Container className="py-4">
      <Card className={styles.specialtyCard}>
        <Card.Header className={styles.cardHeader}>
          <h2>Gestión de Especialidades</h2>
          <Link to="/admin/specialties/add" className={`btn ${styles.primaryButton}`}>
            <i className="bi bi-plus-circle me-2"></i>Nueva Especialidad
          </Link>
        </Card.Header>
        <Card.Body className="p-4">
          <InputGroup className="mb-3">
            <Form.Control placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </InputGroup>
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" style={{ color: '#275950' }} /></div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <>
              <Table responsive hover className={styles.specialtyTable}>
                <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {specialties.map(specialty => (
                    <tr key={specialty.id}>
                      <td>{specialty.id}</td><td>{specialty.name}</td>
                      <td>{specialty.description || '-'}</td>
                      <td><Badge bg={specialty.active ? "success" : "secondary"}>{specialty.active ? 'Activa' : 'Inactiva'}</Badge></td>
                      <td className={styles.actionButtons}>
                        <Link to={`/admin/specialties/edit/${specialty.id}`} className="btn btn-sm btn-warning"><i className="bi bi-pencil-fill"></i></Link>
                        <Button variant="danger" size="sm" onClick={() => { setSpecialtyToDelete(specialty); setShowDeleteModal(true); }}><i className="bi bi-trash-fill"></i></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalPages > 1 && (
                  <div className={styles.paginationContainer}>
                    <Pagination>
                      <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                      <Pagination.Prev onClick={() => setCurrentPage(c => c - 1)} disabled={currentPage === 1} />

                      {/* Esta lógica para mostrar los números de página ya es más robusta, puedes mantenerla o ajustarla si prefieres */}
                      {[...Array(totalPages).keys()].map(number => (
                        <Pagination.Item key={number + 1} active={number + 1 === currentPage} onClick={() => setCurrentPage(number + 1)}>
                          {number + 1}
                        </Pagination.Item>
                      ))}

                      <Pagination.Next onClick={() => setCurrentPage(c => c + 1)} disabled={currentPage === totalPages} />
                      <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                  </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirmar Eliminación</Modal.Title></Modal.Header>
        <Modal.Body>¿Seguro que deseas eliminar la especialidad <strong>{specialtyToDelete?.name}</strong>?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteSpecialty}>Eliminar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Specialties;