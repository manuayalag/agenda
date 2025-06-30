import { useState, useEffect, useCallback } from 'react';
import { Container, Card, Table, Button, Badge, Modal, Form, InputGroup, Pagination, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Users.module.css';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/users', {
        params: { search: debouncedSearchTerm, page: currentPage, size: 10 }
      });
      setUsers(response.data.items || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err) {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      fetchUsers(); // Recargar usuarios
      setShowDeleteModal(false);
    } catch (err) {
      setError('Error al eliminar usuario');
    }
  };

  const getRoleBadge = (role) => {
    const roles = {
      admin: <Badge bg="danger">Administrador</Badge>,
      sector_admin: <Badge bg="primary">Admin de Sector</Badge>,
      doctor: <Badge bg="success">Doctor</Badge>,
    };
    return roles[role] || <Badge bg="secondary">{role}</Badge>;
  };

  return (
    <Container className="py-4">
      <Card className={styles.userCard}>
        <Card.Header className={styles.cardHeader}>
          <h2>Gestión de Usuarios</h2>
          <Link to="/admin/users/add" className={`btn ${styles.primaryButton}`}>
            <i className="bi bi-plus-circle me-2"></i>Nuevo Usuario
          </Link>
        </Card.Header>
        <Card.Body className="p-4">
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" style={{ color: '#275950' }} /></div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <>
              <Table responsive hover className={styles.userTable}>
                <thead>
                  <tr>
                    <th>Nombre</th><th>Email</th><th>Rol</th><th>Sector</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.fullName}</td>
                      <td>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{user.sector?.name || '-'}</td>
                      <td><Badge bg={user.active ? "success" : "secondary"}>{user.active ? 'Activo' : 'Inactivo'}</Badge></td>
                      <td className={styles.actionButtons}>
                        <Link to={`/admin/users/edit/${user.id}`} className="btn btn-sm btn-warning"><i className="bi bi-pencil-fill"></i></Link>
                        <Button variant="danger" size="sm" onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }}><i className="bi bi-trash-fill"></i></Button>
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
        <Modal.Body>¿Seguro que deseas eliminar a <strong>{userToDelete?.fullName}</strong>?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteUser}>Eliminar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Users;