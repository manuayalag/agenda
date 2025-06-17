import React, { useEffect, useState, useContext } from 'react';
import { Button, Table, Modal } from 'react-bootstrap';
import TicketService from '../../services/TicketService';
import TicketForm from './TicketForm';
import { AuthContext } from '../../context/AuthContextValue';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { isDoctor } = useContext(AuthContext);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await TicketService.getAll();
      setTickets(res.data);
    } catch (err) {
      // Manejo de error
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleEdit = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const handleClose = () => {
    setSelectedTicket(null);
    setShowModal(false);
  };

  const handleSave = () => {
    fetchTickets();
    handleClose();
  };

  if (isDoctor) {
    return <div>No tienes permiso para ver los tickets.</div>;
  }

  return (
    <div>
      <h2>Tickets</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Mensaje</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.id}>
              <td>{ticket.id}</td>
              <td>{ticket.clientName || ticket.name}</td>
              <td>{ticket.message}</td>
              <td>{ticket.status}</td>
              <td>
                <Button size="sm" onClick={() => handleEdit(ticket)}>
                  Ver / Editar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Ticket</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TicketForm ticket={selectedTicket} onSave={handleSave} onCancel={handleClose} />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Tickets;
