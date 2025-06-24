module.exports = (sequelize, DataTypes) => {
  const PrestadorServicio = sequelize.define('PrestadorServicio', {
    id_prestador: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    id_servicio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  }, {
    tableName: 'prestador_servicio',
    timestamps: false
  });
  return PrestadorServicio;
};
