module.exports = (sequelize, DataTypes) => {
  const Specialty = sequelize.define('Specialty', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    tableName: 'specialties',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name']
      }
    ]
  });

  return Specialty;
};
