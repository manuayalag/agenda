import { useEffect, useState, useMemo, useCallback } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Spinner, InputGroup } from 'react-bootstrap';
import SeguroService from '../../services/SeguroService';
import SeguroCoberturaService from '../../services/SeguroCoberturaService';
import ServicioService from '../../services/ServicioService';
import styles from './Seguros.module.css';

const SegurosMedicos = () => {
  // Estado general
  const [seguros, setSeguros] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estado para la vista principal (lista de seguros)
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para la vista de detalle (coberturas)
  const [selectedSeguro, setSelectedSeguro] = useState(null);
  const [coberturas, setCoberturas] = useState([]);
  const [loadingCoberturas, setLoadingCoberturas] = useState(false);

  // Modales
  const [modal, setModal] = useState({ type: null, data: null });

  const fetchSeguros = useCallback(async () => {
    setLoading(true);
    try {
      const res = await SeguroService.getAll();
      setSeguros(res.data);
    } catch (err) {
      setError('Error al cargar los seguros.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeguros();
    ServicioService.getAll().then(res => setServicios(res.data)).catch(() => setError('Error al cargar los servicios.'));
  }, [fetchSeguros]);

  const handleSelectSeguro = async (seguro) => {
    setSelectedSeguro(seguro);
    setLoadingCoberturas(true);
    try {
      const res = await SeguroCoberturaService.getServicios(seguro.id_seguro);
      setCoberturas(res.data);
    } catch (err) {
      setError('Error al cargar las coberturas.');
    } finally {
      setLoadingCoberturas(false);
    }
  };

  const handleReturnToList = () => {
    setSelectedSeguro(null);
    setCoberturas([]);
    setError('');
    setSuccess('');
  };
  
  const handleSaveSeguro = async (nombre) => {
    const seguroId = modal.data?.id_seguro;
    try {
      if (seguroId) {
        await SeguroService.update(seguroId, { nombre });
      } else {
        await SeguroService.create({ nombre });
      }
      setSuccess(`Seguro ${seguroId ? 'actualizado' : 'creado'} correctamente.`);
      fetchSeguros();
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Error al guardar el seguro');
    }
  };

  const handleDeleteSeguro = async () => {
    try {
      await SeguroService.delete(modal.data.id_seguro);
      setSuccess('Seguro eliminado correctamente.');
      fetchSeguros();
    } catch (err) {
      throw new Error('No se pudo eliminar el seguro.');
    }
  };
  
  const handleSaveCobertura = async (form) => {
    const { id_servicio, porcentaje_cobertura } = form;
    const isEditing = !!modal.data?.id_servicio;
    try {
        if (isEditing) {
            await SeguroCoberturaService.updateServicio(selectedSeguro.id_seguro, id_servicio, { porcentaje_cobertura });
        } else {
            await SeguroCoberturaService.addServicio(selectedSeguro.id_seguro, { id_servicio, porcentaje_cobertura });
        }
        setSuccess(`Cobertura ${isEditing ? 'actualizada' : 'agregada'} correctamente.`);
        handleSelectSeguro(selectedSeguro);
    } catch (err) {
        throw new Error(err.response?.data?.error || 'Error al guardar la cobertura.');
    }
  };
  
  const handleDeleteCobertura = async () => {
    try {
        await SeguroCoberturaService.removeServicio(selectedSeguro.id_seguro, modal.data.id_servicio);
        setSuccess('Cobertura eliminada correctamente.');
        handleSelectSeguro(selectedSeguro);
    } catch(err) {
        throw new Error('No se pudo eliminar la cobertura.');
    }
  };

  const filteredSeguros = useMemo(() =>
    seguros.filter(s => s.nombre.toLowerCase().includes(searchTerm.toLowerCase())),
    [seguros, searchTerm]
  );
  
  const showFlashMessage = (setter, message) => {
    setter(message);
    setTimeout(() => setter(''), 5000);
  };

  const renderSeguroList = () => (
    <Card className={styles.seguroCard}>
      <Card.Header className={styles.cardHeader}>
        <h2>Gestión de Seguros Médicos</h2>
        <Button className={styles.primaryButton} onClick={() => setModal({ type: 'editSeguro', data: null })}>
          <i className="bi bi-plus-circle me-2"></i>Nuevo Seguro
        </Button>
      </Card.Header>
      <Card.Body className="p-4">
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
        <InputGroup className="mb-3">
          <Form.Control placeholder="Buscar por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </InputGroup>
        
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" style={{ color: '#275950' }} /></div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <Table responsive hover className={styles.seguroTable}>
            <thead>
              <tr><th>ID</th><th>Nombre</th><th className="text-center">Acciones</th></tr>
            </thead>
            <tbody>
              {filteredSeguros.map(seguro => (
                <tr key={seguro.id_seguro}>
                  <td>{seguro.id_seguro}</td>
                  <td>{seguro.nombre}</td>
                  <td className={`text-center ${styles.actionButtons}`}>
                    <Button size="sm" variant="success" onClick={() => handleSelectSeguro(seguro)} className="me-2 text-white"><i className="bi bi-list-check me-1"></i> Coberturas</Button>
                    <Button size="sm" variant="warning" onClick={() => setModal({ type: 'editSeguro', data: seguro })} className="me-2"><i className="bi bi-pencil-fill"></i></Button>
                    <Button size="sm" variant="danger" onClick={() => setModal({ type: 'deleteSeguro', data: seguro })}><i className="bi bi-trash-fill"></i></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );

  const renderCoverageDetails = () => (
     <Card className={styles.seguroCard}>
      <Card.Header className={styles.cardHeader}>
        <div>
          <h2>Coberturas de: {selectedSeguro.nombre}</h2>
        </div>
        <Button className={styles.primaryButton} onClick={() => setModal({ type: 'editCobertura', data: null })}>
          <i className="bi bi-plus-circle me-2"></i>Nueva Cobertura
        </Button>
      </Card.Header>
      <Card.Body className="p-4">
        <Button variant="secondary" onClick={handleReturnToList} className="mb-3">
            <i className="bi bi-arrow-left-circle me-2"></i>Volver a la lista de seguros
        </Button>
        {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
        {loadingCoberturas ? (
          <div className="text-center py-5"><Spinner animation="border" style={{ color: '#275950' }} /></div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <Table responsive hover className={styles.seguroTable}>
            <thead>
              <tr><th>Servicio</th><th>% Cobertura</th><th className="text-center">Acciones</th></tr>
            </thead>
            <tbody>
              {coberturas.map(c => (
                <tr key={c.id_servicio}>
                  <td>{c.nombre_servicio}</td>
                  <td>{c.porcentaje_cobertura}%</td>
                  <td className={`text-center ${styles.actionButtons}`}>
                    <Button size="sm" variant="warning" onClick={() => setModal({ type: 'editCobertura', data: c })} className="me-2"><i className="bi bi-pencil-fill"></i></Button>
                    <Button size="sm" variant="danger" onClick={() => setModal({ type: 'deleteCobertura', data: c })}><i className="bi bi-trash-fill"></i></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
  
  return (
    <Container className="py-4">
      {selectedSeguro ? renderCoverageDetails() : renderSeguroList()}
      <FormModal
        show={modal.type === 'editSeguro'}
        onHide={() => setModal({ type: null, data: null })}
        title={modal.data ? 'Editar Seguro' : 'Nuevo Seguro'}
        initialData={modal.data}
        onSubmit={handleSaveSeguro}
        fields={[{ name: 'nombre', label: 'Nombre del Seguro', placeholder: 'Ej: Seguro ABC' }]}
        showFlashMessage={showFlashMessage}
      />
      <DeleteModal
        show={modal.type === 'deleteSeguro'}
        onHide={() => setModal({ type: null, data: null })}
        onConfirm={handleDeleteSeguro}
        item={modal.data?.nombre}
        showFlashMessage={showFlashMessage}
      />
      <FormModal
        show={modal.type === 'editCobertura'}
        onHide={() => setModal({ type: null, data: null })}
        title={modal.data ? 'Editar Cobertura' : 'Nueva Cobertura'}
        initialData={modal.data}
        onSubmit={handleSaveCobertura}
        fields={[
          { name: 'id_servicio', label: 'Servicio', type: 'select', options: servicios.map(s => ({ value: s.id, label: s.nombre_servicio })), disabled: !!modal.data },
          { name: 'porcentaje_cobertura', label: '% Cobertura', type: 'number', min: 0, max: 100 }
        ]}
        showFlashMessage={showFlashMessage}
      />
       <DeleteModal
        show={modal.type === 'deleteCobertura'}
        onHide={() => setModal({ type: null, data: null })}
        onConfirm={handleDeleteCobertura}
        item={`la cobertura de "${modal.data?.nombre_servicio}"`}
        showFlashMessage={showFlashMessage}
      />
    </Container>
  );
};

const FormModal = ({ show, onHide, title, initialData, onSubmit, fields, showFlashMessage }) => {
  const [formData, setFormData] = useState({});
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (show) {
      const initial = fields.reduce((acc, field) => {
        acc[field.name] = initialData?.[field.name] ?? '';
        return acc;
      }, {});
      setFormData(initial);
      setLocalError('');
    }
  }, [show, initialData, fields]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    for (const field of fields) {
      if (!formData[field.name]) {
        setLocalError(`El campo "${field.label}" es obligatorio.`);
        return;
      }
    }
    try {
      await onSubmit(formData);
      onHide();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
      <Modal.Body>
        {localError && <Alert variant="danger">{localError}</Alert>}
        {fields.map(field => (
          <Form.Group key={field.name} className="mb-3">
            <Form.Label className={styles.formLabel}>{field.label}</Form.Label>
            {field.type === 'select' ? (
              <Form.Select name={field.name} value={formData[field.name] || ''} onChange={handleChange} disabled={field.disabled}>
                <option value="">Seleccione...</option>
                {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Form.Select>
            ) : (
              <Form.Control type={field.type || 'text'} name={field.name} value={formData[field.name] || ''} onChange={handleChange} {...field} />
            )}
          </Form.Group>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancelar</Button>
        <Button variant="primary" className={styles.primaryButton} onClick={handleSave}>Guardar</Button>
      </Modal.Footer>
    </Modal>
  );
};

const DeleteModal = ({ show, onHide, onConfirm, item, showFlashMessage }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
      setLoading(true);
      try {
          await onConfirm();
          onHide();
      } catch (err) {
          showFlashMessage(setError, err.message);
          onHide();
      } finally {
          setLoading(false);
      }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title><i className="bi bi-trash3-fill text-danger me-2"></i>Confirmar Eliminación</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        ¿Estás seguro que deseas eliminar <strong>{item}</strong>? Esta acción no se puede deshacer.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancelar</Button>
        <Button variant="danger" onClick={handleDelete} disabled={loading}>
          {loading ? <Spinner as="span" size="sm" /> : 'Eliminar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SegurosMedicos;