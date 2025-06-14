module.exports = (sequelize, DataTypes) => {
  const Doctor = sequelize.define('Doctor', {    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    specialtyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'specialties',
        key: 'id'
      }
    },
    sectorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'sectors',
        key: 'id'
      }
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    workingDays: {
      type: DataTypes.ARRAY(DataTypes.INTEGER), // Array de números [1,2,3,4,5,6,7] donde 1=lunes, 7=domingo
      allowNull: true
    },
    workingHourStart: {
      type: DataTypes.TIME,
      allowNull: true
    },
    workingHourEnd: {
      type: DataTypes.TIME,
      allowNull: true
    },
    appointmentDuration: {
      type: DataTypes.INTEGER, // Duración en minutos
      allowNull: true,
      defaultValue: 30
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    tableName: 'doctors',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['license_number']
      },
      {
        fields: ['specialty_id']
      },
      {
        fields: ['sector_id']
      }
    ]
  });

  return Doctor;
};
