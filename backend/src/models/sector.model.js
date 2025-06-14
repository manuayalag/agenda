module.exports = (sequelize, DataTypes) => {
  const Sector = sequelize.define('Sector', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },    adminId: {
      type: DataTypes.INTEGER,
      allowNull: true
      // Reference will be added after tables are created
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    tableName: 'sectors',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name']
      }
    ]
  });

  return Sector;
};
