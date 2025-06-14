const db = require('../models');
const User = db.User;
const Doctor = db.Doctor;
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const where = {};
    
    // Filtrar por rol si se proporciona
    if (role) {
      where.role = role;
    }
    
    const users = await User.findAll({
      where,
      attributes: ['id', 'username', 'email', 'fullName', 'role', 'sectorId', 'active', 'lastLogin', 'createdAt', 'updatedAt'],
      include: [
        {
          model: db.Sector,
          as: 'sector',
          attributes: ['id', 'name'],
          required: false
        }
      ]
    });
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Obtener usuario por ID
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
      const doctorInfo = await Doctor.findOne({ 
        where: { userId: user.id },
        include: [
          { model: db.Specialty, as: 'specialty' },
          { model: db.Sector, as: 'sector' }
        ]
      });
      
      if (doctorInfo) {
        user.dataValues.doctorInfo = doctorInfo;
      }
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// Actualizar usuario
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
      const doctor = await Doctor.findOne({ where: { userId: user.id } });
      
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

// Eliminar usuario
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
