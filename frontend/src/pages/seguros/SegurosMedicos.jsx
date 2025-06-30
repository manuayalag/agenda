import { useEffect, useState } from 'react';
import SeguroService from '../../services/SeguroService';
import { Button, Table, Form, Modal, Alert } from 'react-bootstrap';

const SegurosMedicos = () => {
  const [seguros, setSeguros] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  const fetchSeguros = async () => {
    const res = await SeguroService.getAll();
    setSeguros(res.data);
  };

  useEffect(() => {
    fetchSeguros();
  }, []);

  const handleShowModal = (seguro = null) => {
    setEditing(seguro);
    setNombre(seguro ? seguro.nombre : '');
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setNombre('');
    setError('');
  };

  const handleSave = async () => {
    try {
      if (!nombre.trim()) {
        setError('El nombre es obligatorio');
        return;
      }
      if (editing) {
        await SeguroService.update(editing.id_seguro, { nombre });
      } else {
        await SeguroService.create({ nombre });
      }
      fetchSeguros();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este seguro?')) {
      await SeguroService.delete(id);
      fetchSeguros();
    }
  };

  return (
    <div className="container mt-4">
      <h2>Seguros Médicos</h2>
      <Button variant="primary" onClick={() => handleShowModal()}>Nuevo Seguro</Button>
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {seguros.map(seguro => (
            <tr key={seguro.id_seguro}>
              <td>{seguro.id_seguro}</td>
              <td>{seguro.nombre}</td>
              <td>
                <Button size="sm" variant="warning" onClick={() => handleShowModal(seguro)}>Editar</Button>{' '}
                <Button size="sm" variant="danger" onClick={() => handleDelete(seguro.id_seguro)}>Eliminar</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Editar Seguro' : 'Nuevo Seguro'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group>
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del seguro"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>Guardar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SegurosMedicos;