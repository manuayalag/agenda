module.exports = (sequelize, DataTypes) => {
  const CoberturaSeguro = sequelize.define('CoberturaSeguro', {
    id_seguro: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    id_servicio: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    porcentaje_cobertura: {
      type: DataTypes.DECIMAL(5,2),
      allowNull: false
    }
  }, {
    tableName: 'cobertura_seguro',
    timestamps: false
  });

  return CoberturaSeguro;
};