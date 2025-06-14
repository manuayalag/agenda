const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
const Doctor = db.Doctor;
const Sector = db.Sector;

// Función de registro de usuario
exports.signup = async (req, res) => {
  try {
    // Crear usuario
    const user = await User.create({
      username: req.body.username,
      email: req.body.email,
      fullName: req.body.fullName,
      password: bcrypt.hashSync(req.body.password, 8),
      role: req.body.role || 'sector_admin',
      sectorId: req.body.sectorId
    });

    // Si es doctor, crear entrada en tabla doctors
    if (req.body.role === 'doctor' && req.body.specialtyId) {
      await Doctor.create({
        userId: user.id,
        specialtyId: req.body.specialtyId,
        sectorId: req.body.sectorId,
        licenseNumber: req.body.licenseNumber,
        workingDays: req.body.workingDays,
        workingHourStart: req.body.workingHourStart,
        workingHourEnd: req.body.workingHourEnd,
        appointmentDuration: req.body.appointmentDuration || 30
      });
    }

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Función de inicio de sesión
exports.signin = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        username: req.body.username
      }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: 'Usuario desactivado'
      });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        message: 'Contraseña incorrecta'
      });
    }

    // Actualizar fecha de último acceso
    await user.update({
      lastLogin: new Date()
    });

    // Generar token de autenticación
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: 86400 // 24 horas
    });

    let doctorInfo = null;
    let sectorInfo = null;

    // Si es doctor, obtener información adicional
    if (user.role === 'doctor') {
      doctorInfo = await Doctor.findOne({
        where: { userId: user.id },
        include: [
          { model: db.Specialty, as: 'specialty' },
          { model: db.Sector, as: 'sector' }
        ]
      });
    }

    // Si es admin de sector, obtener información del sector
    if (user.role === 'sector_admin' && user.sectorId) {
      sectorInfo = await Sector.findByPk(user.sectorId);
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      sectorId: user.sectorId,
      doctor: doctorInfo,
      sector: sectorInfo,
      accessToken: token
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
