import { useState, useEffect, useContext } from 'react';
import { Container, Card, Table, Button, Badge, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContextValue';

const Doctors = () => {
  const { user } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      // Si es admin de sector, solo muestra los doctores de su sector
      const endpoint = user?.role === 'sector_admin' && user?.sectorId 
        ? `/doctors?sectorId=${user.sectorId}` 
        : '/doctors';
        
      const response = await api.get(endpoint);
      setDoctors(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar doctores: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDeleteModal = (doctor) => {
    setDoctorToDelete(doctor);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDoctorToDelete(null);
  };

  const handleDeleteDoctor = async () => {
    if (!doctorToDelete) return;

    try {
      await api.delete(`/doctors/${doctorToDelete.id}`);
      setDoctors(doctors.filter(doctor => doctor.id !== doctorToDelete.id));
      handleCloseDeleteModal();
    } catch (err) {
      setError('Error al eliminar doctor: ' + (err.response?.data?.message || err.message));
      console.error('Error deleting doctor:', err);
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
          <h2>Gestión de Doctores</h2>
          <Link to="/doctors/add" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Nuevo Doctor
          </Link>
        </Card.Header>
        <Card.Body>
          {error && <div className="alert alert-danger">{error}</div>}

          <Table responsive striped hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Sector</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">No hay doctores disponibles</td>
                </tr>
              ) : (
                doctors.map(doctor => (
                  <tr key={doctor.id}>
                    <td>{doctor.id}</td>
                    <td>{doctor.name}</td>
                    <td>{doctor.specialty?.name || '-'}</td>
                    <td>{doctor.sector?.name || '-'}</td>
                    <td>{doctor.email}</td>
                    <td>{doctor.phone || '-'}</td>
                    <td>
                      {doctor.active ? (
                        <Badge bg="success">Activo</Badge>
                      ) : (
                        <Badge bg="secondary">Inactivo</Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link to={`/doctors/edit/${doctor.id}`} className="btn btn-sm btn-warning">
                          <i className="bi bi-pencil-fill"></i>
                        </Link>
                        <Link to={`/doctors/${doctor.id}/schedule`} className="btn btn-sm btn-info">
                          <i className="bi bi-calendar-week"></i>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleShowDeleteModal(doctor)}
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
          ¿Estás seguro que deseas eliminar al doctor <strong>{doctorToDelete?.name}</strong>?
          Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteDoctor}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Doctors;
