import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Modal, Form, InputGroup, Pagination, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
// --- CORRECCIÓN FINAL Y DEFINITIVA DE LA RUTA ---
import api from '../../utils/api';
import styles from './Sectors.module.css';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const Sectors = () => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sectorToDelete, setSectorToDelete] = useState(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchSectors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/sectors', {
        params: { search: debouncedSearchTerm, page: currentPage, size: 10 }
      });
      setSectors(response.data.items || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      setError('Error al cargar los sectores.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchSectors();
  }, [fetchSectors]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleDeleteSector = async () => {
    if (!sectorToDelete) return;
    try {
      await api.delete(`/sectors/${sectorToDelete.id}`);
      fetchSectors();
      setShowDeleteModal(false);
      setSectorToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el sector.');
    }
  };

  return (
    <Container className="py-4">
      <Card className={styles.sectorCard}>
        <Card.Header className={styles.cardHeader}>
          <h2>Gestión de Sectores</h2>
          <Link to="/admin/sectors/add" className={`btn ${styles.primaryButton}`}>
            <i className="bi bi-plus-circle me-2"></i>Nuevo Sector
          </Link>
        </Card.Header>
        <Card.Body className="p-4">
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" style={{ color: '#275950' }} /></div>
          ) : error ? (
            <Alert variant="danger">{error}</Alert>
          ) : (
            <>
              <Table responsive hover className={styles.sectorTable}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Administrador</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sectors.map(sector => (
                    <tr key={sector.id}>
                      <td>{sector.id}</td>
                      <td>{sector.name}</td>
                      <td>{sector.admin?.fullName || 'N/A'}</td>
                      <td><Badge bg={sector.active ? "success" : "secondary"}>{sector.active ? 'Activo' : 'Inactivo'}</Badge></td>
                      <td className={styles.actionButtons}>
                        <Link to={`/admin/sectors/edit/${sector.id}`} className="btn btn-sm btn-warning">
                          <i className="bi bi-pencil-fill"></i>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSectorToDelete(sector);
                            setShowDeleteModal(true);
                          }}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </Button>
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
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Seguro que deseas eliminar el sector <strong>{sectorToDelete?.name}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteSector}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Sectors;