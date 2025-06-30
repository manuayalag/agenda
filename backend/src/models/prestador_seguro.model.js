module.exports = (sequelize, DataTypes) => {
  const PrestadorSeguro = sequelize.define('PrestadorSeguro', {
    id_prestador: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    id_seguro: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  }, {
    tableName: 'prestador_seguro',
    timestamps: false
  });

  return PrestadorSeguro;
};