const Ticket = require('../models/ticket.model');

// Crear ticket (POST /api/tickets)
exports.create = async (req, res) => {
  try {
    const ticket = await Ticket.create(req.body);
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Listar tickets (GET /api/tickets)
exports.getAll = async (req, res) => {
  try {
    const tickets = await Ticket.findAll({ order: [['createdAt', 'DESC']] });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Ver detalle (GET /api/tickets/:id)
exports.getById = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'No encontrado' });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Actualizar ticket (PUT /api/tickets/:id)
exports.update = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'No encontrado' });
    await ticket.update(req.body);
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Eliminar ticket (DELETE /api/tickets/:id)
exports.remove = async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'No encontrado' });
    await ticket.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
