module.exports = (sequelize, DataTypes) => {
  const Prestador = sequelize.define('Prestador', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      field: 'user_id'
    },
    specialtyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'specialties',
        key: 'id'
      },
      field: 'specialty_id'
    },
    sectorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sectors',
        key: 'id'
      },
      field: 'sector_id'
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'license_number'
    },
    workingDays: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      field: 'working_days'
    },
    workingHourStart: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'working_hour_start'
    },
    workingHourEnd: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'working_hour_end'
    },
    appointmentDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 30,
      field: 'appointment_duration'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'active'
    }
  }, {
    timestamps: true,
    tableName: 'prestadores',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['license_number']
      }
    ]
  });

  // Asociación con Specialty
  Prestador.associate = (models) => {
    Prestador.belongsTo(models.Specialty, { foreignKey: 'specialtyId', as: 'specialty' });
  };

  return Prestador;
};
