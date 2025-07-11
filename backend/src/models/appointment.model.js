module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    prestadorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'prestadores',
        key: 'id'
      }
    },
    servicioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'servicio',
        key: 'id_servicio'
      }
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'no_show'),
      defaultValue: 'scheduled'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'appointments',
    underscored: true,
    indexes: [
      {
        fields: ['prestador_id']
      },
      {
        fields: ['servicio_id']
      },
      {
        fields: ['patient_id']
      },
      {
        fields: ['date']
      },
      {
        fields: ['status']
      }
    ]
  });

  return Appointment;
};
