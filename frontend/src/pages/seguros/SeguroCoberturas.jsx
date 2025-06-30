import { useEffect, useState } from "react";
import SeguroService from "../../services/SeguroService";
import ServicioService from "../../services/ServicioService";
import SeguroCoberturaService from "../../services/SeguroCoberturaService";
import { Table, Button, Form, Modal, Alert } from "react-bootstrap";

const SeguroCoberturas = () => {
  const [seguros, setSeguros] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [selectedSeguro, setSelectedSeguro] = useState("");
  const [coberturas, setCoberturas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCobertura, setEditCobertura] = useState(null);
  const [form, setForm] = useState({ id_servicio: "", porcentaje_cobertura: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    SeguroService.getAll().then(res => setSeguros(res.data));
    ServicioService.getAll().then(res => setServicios(res.data));
  }, []);

  useEffect(() => {
    if (selectedSeguro) {
      SeguroCoberturaService.getServicios(selectedSeguro).then(res => setCoberturas(res.data));
    } else {
      setCoberturas([]);
    }
  }, [selectedSeguro]);

  const handleShowModal = (cobertura = null) => {
    setEditCobertura(cobertura);
    setForm(cobertura
      ? { id_servicio: cobertura.id_servicio, porcentaje_cobertura: cobertura.porcentaje_cobertura }
      : { id_servicio: "", porcentaje_cobertura: "" }
    );
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.id_servicio || !form.porcentaje_cobertura) {
      setError("Completa todos los campos");
      return;
    }
    try {
      if (editCobertura) {
        await SeguroCoberturaService.updateServicio(selectedSeguro, form.id_servicio, { porcentaje_cobertura: form.porcentaje_cobertura });
      } else {
        await SeguroCoberturaService.addServicio(selectedSeguro, form);
      }
      SeguroCoberturaService.getServicios(selectedSeguro).then(res => setCoberturas(res.data));
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.error || "Error al guardar");
    }
  };

  const handleDelete = async (id_servicio) => {
    if (window.confirm("¿Quitar este servicio del seguro?")) {
      await SeguroCoberturaService.removeServicio(selectedSeguro, id_servicio);
      SeguroCoberturaService.getServicios(selectedSeguro).then(res => setCoberturas(res.data));
    }
  };

  return (
    <div className="container mt-4">
      <h2>Servicios cubiertos por Seguros</h2>
      <Form.Select
        value={selectedSeguro}
        onChange={e => setSelectedSeguro(e.target.value)}
        style={{ maxWidth: 400, marginBottom: 20 }}
      >
        <option value="">Selecciona un seguro...</option>
        {seguros.map(seguro => (
          <option key={seguro.id_seguro} value={seguro.id_seguro}>{seguro.nombre}</option>
        ))}
      </Form.Select>

      {selectedSeguro && (
        <>
          <Button variant="primary" className="mb-3" onClick={() => handleShowModal()}>
            Agregar servicio cubierto
          </Button>
          <Table bordered hover>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>% Cobertura</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {coberturas.map(c => (
                <tr key={c.id_servicio}>
                  <td>{c.nombre_servicio}</td>
                  <td>{c.porcentaje_cobertura}%</td>
                  <td>
                    <Button size="sm" variant="warning" onClick={() => handleShowModal(c)}>Editar</Button>{" "}
                    <Button size="sm" variant="danger" onClick={() => handleDelete(c.id_servicio)}>Quitar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editCobertura ? "Editar Cobertura" : "Agregar Cobertura"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Servicio</Form.Label>
            <Form.Select
              value={form.id_servicio}
              onChange={e => setForm(f => ({ ...f, id_servicio: e.target.value }))}
              disabled={!!editCobertura}
            >
              <option value="">Selecciona un servicio...</option>
              {servicios.map(s => (
                <option key={s.id_servicio || s.id} value={s.id_servicio || s.id}>
                  {s.nombre_servicio}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>% Cobertura</Form.Label>
            <Form.Control
              type="number"
              min={0}
              max={100}
              value={form.porcentaje_cobertura}
              onChange={e => setForm(f => ({ ...f, porcentaje_cobertura: e.target.value }))}
              placeholder="Porcentaje de cobertura"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>Guardar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SeguroCoberturas;