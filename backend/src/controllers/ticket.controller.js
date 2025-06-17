const Ticket = require('../models/ticket.model');
const db = require('../models');
const User = db.User;

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
    // Obtener usuario autenticado
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    let tickets = [];
    if (user.role === 'admin') {
      tickets = await Ticket.findAll({ order: [['createdAt', 'DESC']] });
    } else if (user.role === 'sector_admin') {
      tickets = await Ticket.findAll({
        where: { sectorId: user.sectorId },
        order: [['createdAt', 'DESC']]
      });
    } else if (user.role === 'doctor') {
      // Doctor no puede ver tickets
      return res.json([]);
    } else {
      return res.status(403).json({ error: 'No autorizado' });
    }
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
