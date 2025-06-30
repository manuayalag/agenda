module.exports = (sequelize, DataTypes) => {
  const ServicioSeguro = sequelize.define('ServicioSeguro', {
    id_seguro: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    id_servicio: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  }, {
    tableName: 'servicio_seguro',
    timestamps: false
  });

  return ServicioSeguro;
};