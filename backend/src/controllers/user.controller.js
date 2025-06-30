const db = require('../models');
const User = db.User;
const Prestador = db.Prestador;
const bcrypt = require('bcryptjs');
const { Op } = db.Sequelize;

// Funciones de ayuda para paginación
const getPagination = (page, size) => {
  const limit = size ? +size : 10;
  const offset = page ? (page - 1) * limit : 0;
  return { limit, offset };
};

const getPagingData = (data, page, limit) => {
  const { count: totalItems, rows: items } = data;
  const currentPage = page ? +page : 1;
  const totalPages = Math.ceil(totalItems / limit);
  return { totalItems, items, totalPages, currentPage };
};

// Obtener todos los usuarios con paginación y búsqueda
exports.getAllUsers = async (req, res) => {
  const { page, size, search } = req.query;
  const { limit, offset } = getPagination(page, size);

  const condition = search
    ? {
        [Op.or]: [
          { fullName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ]
      }
    : null;

  try {
    const data = await User.findAndCountAll({
      where: condition,
      limit,
      offset,
      attributes: ['id', 'username', 'email', 'fullName', 'role', 'sectorId', 'active'],
      include: [{ model: db.Sector, as: 'sector', attributes: ['id', 'name'] }],
      order: [['fullName', 'ASC']]
    });

    const response = getPagingData(data, page, limit);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { username, email, password, fullName, role, sectorId, active } = req.body;

    // Verificar si el usuario o email ya existen
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username: username }, { email: email }] }
    });
    if (existingUser) {
      return res.status(400).send({ message: "El nombre de usuario o el email ya están en uso." });
    }

    // Crear el nuevo usuario
    const user = await User.create({
      username: username,
      email: email,
      password: bcrypt.hashSync(password, 8),
      fullName: fullName,
      role: role,
      sectorId: role === 'admin' ? null : sectorId, // El sector es nulo si es admin general
      active: active
    });

    res.status(201).send({ message: "Usuario creado exitosamente!", userId: user.id });

  } catch (error) {
    res.status(500).send({ message: error.message || "Ocurrió un error al crear el usuario." });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'username', 'email', 'fullName', 'role', 'sectorId', 'active', 'lastLogin', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }
    
    // Si es doctor, incluir información adicional
    if (user.role === 'doctor') {
      const prestadorInfo = await Prestador.findOne({ 
        where: { userId: user.id },
        include: [
          { model: db.Specialty, as: 'specialty' },
          { model: db.Sector, as: 'sector' }
        ]
      });
      
      if (prestadorInfo) {
        user.dataValues.prestadorInfo = prestadorInfo;
      }
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }
    
    // Actualizar usuario
    const userData = {
      fullName: req.body.fullName || user.fullName,
      email: req.body.email || user.email,
      active: req.body.active !== undefined ? req.body.active : user.active
    };
    
    // Solo el admin puede cambiar roles y sectores
    if (req.body.role && req.userRole === 'admin') {
      userData.role = req.body.role;
    }
    
    if (req.body.sectorId && req.userRole === 'admin') {
      userData.sectorId = req.body.sectorId;
    }
    
    // Si se proporciona una nueva contraseña, hashearla
    if (req.body.password) {
      userData.password = bcrypt.hashSync(req.body.password, 8);
    }
    
    await user.update(userData);
    
    // Si es doctor, actualizar información del doctor
    if (user.role === 'doctor') {
      const doctor = await Prestador.findOne({ where: { userId: user.id } });
      
      if (doctor && req.body.doctorInfo) {
        const doctorData = {
          specialtyId: req.body.doctorInfo.specialtyId || doctor.specialtyId,
          sectorId: req.body.doctorInfo.sectorId || doctor.sectorId,
          licenseNumber: req.body.doctorInfo.licenseNumber || doctor.licenseNumber,
          workingDays: req.body.doctorInfo.workingDays || doctor.workingDays,
          workingHourStart: req.body.doctorInfo.workingHourStart || doctor.workingHourStart,
          workingHourEnd: req.body.doctorInfo.workingHourEnd || doctor.workingHourEnd,
          appointmentDuration: req.body.doctorInfo.appointmentDuration || doctor.appointmentDuration,
          active: req.body.doctorInfo.active !== undefined ? req.body.doctorInfo.active : doctor.active
        };
        
        await doctor.update(doctorData);
      }
    }
    
    res.status(200).json({
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }
    
    await user.destroy();
    
    res.status(200).json({
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};