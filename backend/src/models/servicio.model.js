module.exports = (sequelize, DataTypes) => {
  const Servicio = sequelize.define('Servicio', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_servicio'
    },
    nombre_servicio: {
      type: DataTypes.STRING,
      allowNull: false
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    tiempo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Tiempo en minutos que toma el servicio'
    }
  }, {
    tableName: 'servicio',
    timestamps: false
  });
  return Servicio;
};
