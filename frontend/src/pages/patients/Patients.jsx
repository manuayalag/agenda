import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Modal, Form, InputGroup, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Patients.module.css';

// Hook de "debounce" para retrasar la búsqueda y no sobrecargar la API
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const navigate = useNavigate();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms de retraso

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients', {
        params: {
          search: debouncedSearchTerm,
          page: currentPage,
          size: 10 // 10 pacientes por página
        }
      });
      
      // --- CAMBIO APLICADO AQUÍ ---
      // Aseguramos que 'patients' sea siempre un array y 'totalPages' siempre un número
      setPatients(res.data.items || []);
      setTotalPages(res.data.totalPages || 0);

    } catch (err) {
      setError('Error al cargar pacientes');
      // Limpiamos los estados en caso de error para evitar inconsistencias
      setPatients([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleDelete = async () => {
    if (!patientToDelete) return;
    try {
      setLoading(true);
      await api.delete(`/patients/${patientToDelete.id}`);
      setShowDeleteModal(false);
      setPatientToDelete(null);
      fetchPatients();
    } catch (err) {
      setError('Error al eliminar paciente');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
  };
  
  const closeDeleteModal = () => setShowDeleteModal(false);
  
  return (
    <Container className="py-4">
      <Card className={styles.patientCard}>
        <Card.Header className={styles.cardHeader}>
          <h2 className="mb-0">Gestión de Pacientes</h2>
          <Button className={styles.primaryButton} onClick={() => navigate('/patients/add')}>
            <i className="bi bi-plus-circle me-2"></i>Nuevo Paciente
          </Button>
        </Card.Header>
        <Card.Body className="p-4">
          <InputGroup className="mb-3">
            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
            <Form.Control
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" style={{ color: '#275950' }}/></div>
          ) : patients.length === 0 ? (
            <Alert variant="info">No se encontraron pacientes.</Alert>
          ) : (
            <>
              <Table responsive hover className={styles.patientTable}>
                {/* ... (el resto de la tabla no cambia) ... */}
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Documento</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id}>
                      <td>{p.fullName}</td>
                      <td>{p.documentId}</td>
                      <td>{p.phone || '-'}</td>
                      <td>{p.email || '-'}</td>
                      <td className={`text-center ${styles.actionButtons}`}>
                        <Button size="sm" variant="warning" className="me-2" onClick={() => navigate(`/patients/edit/${p.id}`)}>
                          <i className="bi bi-pencil-fill"></i>
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => openDeleteModal(p)}>
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
                    {/* Generar los botones de página */}
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
      
      {/* ... (el Modal no cambia) ... */}
      <Modal show={showDeleteModal} onHide={closeDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Eliminar Paciente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Está seguro que desea eliminar a <strong>{patientToDelete?.fullName}</strong>? Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDeleteModal}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Patients;