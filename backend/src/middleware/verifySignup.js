const db = require('../models');
const User = db.User;

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // Verificar nombre de usuario
    const userByUsername = await User.findOne({
      where: {
        username: req.body.username
      }
    });

    if (userByUsername) {
      return res.status(400).json({
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Verificar email
    const userByEmail = await User.findOne({
      where: {
        email: req.body.email
      }
    });

    if (userByEmail) {
      return res.status(400).json({
        message: 'El correo electrónico ya está en uso'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail
};

module.exports = verifySignUp;
