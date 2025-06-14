import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const Sectors = () => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sectorToDelete, setSectorToDelete] = useState(null);

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sectors');
      setSectors(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar sectores: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching sectors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDeleteModal = (sector) => {
    setSectorToDelete(sector);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSectorToDelete(null);
  };

  const handleDeleteSector = async () => {
    if (!sectorToDelete) return;

    try {
      await api.delete(`/sectors/${sectorToDelete.id}`);
      setSectors(sectors.filter(sector => sector.id !== sectorToDelete.id));
      handleCloseDeleteModal();
    } catch (err) {
      setError('Error al eliminar sector: ' + (err.response?.data?.message || err.message));
      console.error('Error deleting sector:', err);
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
          <h2>Gestión de Sectores</h2>
          <Link to="/admin/sectors/add" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Nuevo Sector
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
                <th>Administrador</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sectors.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No hay sectores disponibles</td>
                </tr>
              ) : (
                sectors.map(sector => (
                  <tr key={sector.id}>
                    <td>{sector.id}</td>
                    <td>{sector.name}</td>
                    <td>{sector.description || '-'}</td>
                    <td>{sector.admin?.fullName || '-'}</td>
                    <td>
                      {sector.active ? (
                        <Badge bg="success">Activo</Badge>
                      ) : (
                        <Badge bg="secondary">Inactivo</Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link to={`/admin/sectors/edit/${sector.id}`} className="btn btn-sm btn-warning">
                          <i className="bi bi-pencil-fill"></i>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleShowDeleteModal(sector)}
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
          ¿Estás seguro que deseas eliminar el sector <strong>{sectorToDelete?.name}</strong>?
          Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
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
