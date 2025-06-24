const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;

const verifyToken = (req, res, next) => {
  // Permitir tanto Authorization: Bearer ... como x-access-token
  let token = null;
  if (req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7); // Quita 'Bearer '
    }
  }
  if (!token && req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (!token) {
    return res.status(403).json({
      message: 'No se proporcionó token de autenticación'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'No autorizado'
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    if (user.role === 'admin') {
      next();
      return;
    }
    
    res.status(403).json({
      message: 'Se requiere rol de Administrador'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const isSectorAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    if (user.role === 'admin' || user.role === 'sector_admin') {
      req.userSectorId = user.sectorId;
      next();
      return;
    }
    
    res.status(403).json({
      message: 'Se requiere rol de Administrador de sector'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const isDoctor = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    if (user.role === 'doctor') {
      const doctor = await db.Doctor.findOne({ where: { userId: user.id } });
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor no encontrado' });
      }
      
      req.prestadorId = doctor.id;
      next();
      return;
    }
    
    res.status(403).json({
      message: 'Se requiere rol de Doctor'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isSectorAdmin,
  isDoctor
};

module.exports = authJwt;
