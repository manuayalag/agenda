const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PrestadorHorario = sequelize.define('PrestadorHorario', {
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
    dia: {
      type: DataTypes.INTEGER, // 1=Lunes, 2=Martes, ..., 7=Domingo
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
  }, {
    tableName: 'prestador_horarios',
    timestamps: false,
  });

  return PrestadorHorario;
};
