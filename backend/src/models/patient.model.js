module.exports = (sequelize, DataTypes) => {
  const Patient = sequelize.define('Patient', {
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    documentId: {
      type: DataTypes.STRING, // Número de cédula
      allowNull: false,
      unique: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('M', 'F', 'O'),
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    insurance: {
      type: DataTypes.STRING,
      allowNull: true
    },
    insuranceNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    allergies: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    medicalHistory: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    tableName: 'patients',
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['document_id']
      },
      {
        fields: ['full_name']
      }
    ]
  });

  return Patient;
};
