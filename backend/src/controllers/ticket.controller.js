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
    if (!user) {
      console.log('[TICKETS] Usuario no autenticado');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    console.log(`[TICKETS] Usuario autenticado: id=${user.id}, role=${user.role}, sectorId=${user.sectorId}`);

    let tickets = [];
    if (user.role === 'admin') {
      console.log('[TICKETS] Rol admin: mostrando todos los tickets');
      tickets = await Ticket.findAll({ order: [['createdAt', 'DESC']] });
    } else if (user.role === 'sector_admin') {
      console.log(`[TICKETS] Rol sector_admin: mostrando tickets del sector ${user.sectorId}`);
      tickets = await Ticket.findAll({
        where: { sectorId: user.sectorId },
        order: [['createdAt', 'DESC']]
      });
    } else if (user.role === 'doctor') {
      console.log('[TICKETS] Rol doctor: no puede ver tickets');
      return res.json([]);
    } else {
      console.log(`[TICKETS] Rol desconocido: ${user.role}`);
      return res.status(403).json({ error: 'No autorizado' });
    }
    console.log(`[TICKETS] Tickets encontrados: ${tickets.length}`);
    res.json(tickets);
  } catch (err) {
    console.error('[TICKETS] Error al obtener tickets:', err);
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
