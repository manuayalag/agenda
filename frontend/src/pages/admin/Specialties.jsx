import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const Specialties = () => {
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState(null);

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/specialties');
      setSpecialties(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar especialidades: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching specialties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDeleteModal = (specialty) => {
    setSpecialtyToDelete(specialty);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSpecialtyToDelete(null);
  };

  const handleDeleteSpecialty = async () => {
    if (!specialtyToDelete) return;

    try {
      await api.delete(`/specialties/${specialtyToDelete.id}`);
      setSpecialties(specialties.filter(specialty => specialty.id !== specialtyToDelete.id));
      handleCloseDeleteModal();
    } catch (err) {
      setError('Error al eliminar especialidad: ' + (err.response?.data?.message || err.message));
      console.error('Error deleting specialty:', err);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h2>Gestión de Especialidades</h2>
          <Link to="/admin/specialties/add" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Nueva Especialidad
          </Link>
        </Card.Header>
        <Card.Body>
          {error && <div className="alert alert-danger">{error}</div>}

          <Table responsive striped hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {specialties.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No hay especialidades disponibles</td>
                </tr>
              ) : (
                specialties.map(specialty => (
                  <tr key={specialty.id}>
                    <td>{specialty.id}</td>
                    <td>{specialty.name}</td>
                    <td>{specialty.description || '-'}</td>
                    <td>
                      {specialty.active ? (
                        <Badge bg="success">Activo</Badge>
                      ) : (
                        <Badge bg="secondary">Inactivo</Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link to={`/admin/specialties/edit/${specialty.id}`} className="btn btn-sm btn-warning">
                          <i className="bi bi-pencil-fill"></i>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleShowDeleteModal(specialty)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro que deseas eliminar la especialidad <strong>{specialtyToDelete?.name}</strong>?
          Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteSpecialty}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Specialties;
