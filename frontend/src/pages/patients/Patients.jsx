import { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PatientService } from '../../utils/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await PatientService.getAll();
      setPatients(res.data);
    } catch (err) {
      setError('Error al cargar pacientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async () => {
    if (!patientToDelete) return;
    try {
      setLoading(true);
      await PatientService.delete(patientToDelete.id);
      setShowDeleteModal(false);
      setPatientToDelete(null);
      fetchPatients();
    } catch (err) {
      setError('Error al eliminar paciente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h2 className="mb-0">Gestión de Pacientes</h2>
          <Button variant="primary" onClick={() => navigate('/patients/add')}>
            Nuevo Paciente
          </Button>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : patients.length === 0 ? (
            <Alert variant="info">No hay pacientes registrados.</Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>{p.fullName}</td>
                    <td>{p.documentId}</td>
                    <td>{p.phone}</td>
                    <td>{p.email}</td>
                    <td>
                      <Button size="sm" variant="outline-primary" className="me-2" onClick={() => navigate(`/patients/edit/${p.id}`)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="outline-danger" onClick={() => { setPatientToDelete(p); setShowDeleteModal(true); }}>
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Eliminar Paciente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Está seguro que desea eliminar a <strong>{patientToDelete?.fullName}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Patients;
