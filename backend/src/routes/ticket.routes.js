const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');

// Crear ticket desde n8n/WhatsApp (sin autenticación)
router.post('/', ticketController.create);

// Obtener todos los tickets
router.get('/', ticketController.getAll);

// Obtener un ticket por ID
router.get('/:id', ticketController.getById);

// Actualizar ticket
router.put('/:id', ticketController.update);

// Eliminar ticket
router.delete('/:id', ticketController.remove);

module.exports = router;
