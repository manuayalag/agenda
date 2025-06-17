import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import TicketService from '../../services/TicketService';

const TicketForm = ({ ticket, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: ticket?.name || '',
    message: ticket?.message || '',
    status: ticket?.status || 'pendiente',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (ticket?.id) {
        await TicketService.update(ticket.id, form);
      } else {
        await TicketService.create(form);
      }
      onSave();
    } catch (err) {
      // Manejo de error
    }
    setSaving(false);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Nombre</Form.Label>
        <Form.Control
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Mensaje</Form.Label>
        <Form.Control
          as="textarea"
          name="message"
          value={form.message}
          onChange={handleChange}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Estado</Form.Label>
        <Form.Select
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En proceso</option>
          <option value="resuelto">Resuelto</option>
        </Form.Select>
      </Form.Group>
      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={saving}>
          Guardar
        </Button>
      </div>
    </Form>
  );
};

export default TicketForm;
