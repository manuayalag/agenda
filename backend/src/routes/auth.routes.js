const controller = require('../controllers/auth.controller');
const { verifySignUp } = require('../middleware');
const express = require('express');
const router = express.Router();

// Rutas para autenticación
router.post(
  '/signup',
  [verifySignUp.checkDuplicateUsernameOrEmail],
  controller.signup
);

router.post('/signin', controller.signin);

module.exports = router;
