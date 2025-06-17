const { DataTypes } = require('sequelize');
const sequelize = require('./index').sequelize;

const Ticket = sequelize.define('Ticket', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sectorId: { type: DataTypes.INTEGER, allowNull: false },
  clientName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  images: { type: DataTypes.JSON, allowNull: true }, // array de URLs o base64
  context: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'abierto' },
}, {
  timestamps: true,
});

module.exports = Ticket;
