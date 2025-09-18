const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PrestadorAusencia = sequelize.define('PrestadorAusencia', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    prestadorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'prestadores',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora_inicio: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    hora_fin: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    motivo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'prestador_ausencias',
    timestamps: true,
  });

  return PrestadorAusencia;
};