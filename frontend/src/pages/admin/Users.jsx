import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar usuarios: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShowDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUsers(users.filter(user => user.id !== userToDelete.id));
      handleCloseDeleteModal();
    } catch (err) {
      setError('Error al eliminar usuario: ' + (err.response?.data?.message || err.message));
      console.error('Error deleting user:', err);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge bg="danger">Administrador</Badge>;
      case 'sector_admin':
        return <Badge bg="primary">Admin de Sector</Badge>;
      case 'doctor':
        return <Badge bg="success">Doctor</Badge>;
      default:
        return <Badge bg="secondary">{role}</Badge>;
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
          <h2>Gestión de Usuarios</h2>
          <Link to="/admin/users/add" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>Nuevo Usuario
          </Link>
        </Card.Header>
        <Card.Body>
          {error && <div className="alert alert-danger">{error}</div>}

          <Table responsive striped hover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Sector</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">No hay usuarios disponibles</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.fullName}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{user.sector?.name || '-'}</td>
                    <td>
                      {user.active ? (
                        <Badge bg="success">Activo</Badge>
                      ) : (
                        <Badge bg="secondary">Inactivo</Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link to={`/admin/users/edit/${user.id}`} className="btn btn-sm btn-warning">
                          <i className="bi bi-pencil-fill"></i>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleShowDeleteModal(user)}
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
          ¿Estás seguro que deseas eliminar al usuario <strong>{userToDelete?.fullName}</strong>?
          Esta acción no se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Users;
