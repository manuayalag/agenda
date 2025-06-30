module.exports = (sequelize, DataTypes) => {
  const SeguroMedico = sequelize.define('SeguroMedico', {
    id_seguro: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'seguros_medicos',
    timestamps: false
  });

  return SeguroMedico;
};