const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/db.config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    logging: false,
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importar modelos - Orden es importante para las relaciones
// Primero las tablas independientes
db.Specialty = require('./specialty.model')(sequelize, DataTypes);
db.Sector = require('./sector.model')(sequelize, DataTypes);
db.Patient = require('./patient.model')(sequelize, DataTypes);

// Luego las tablas que dependen de otras
db.User = require('./user.model')(sequelize, DataTypes);
db.Doctor = require('./doctor.model')(sequelize, DataTypes);
db.Appointment = require('./appointment.model')(sequelize, DataTypes);

// Relaciones entre modelos
// Un usuario puede ser admin o personal administrativo
db.User.hasOne(db.Sector, { 
  foreignKey: 'adminId', 
  as: 'managedSector',
  constraints: false  // Importante: evita que Sequelize intente crear la FK al sincronizar
});
db.Sector.belongsTo(db.User, { 
  foreignKey: 'adminId', 
  as: 'admin',
  constraints: false  // Importante: evita que Sequelize intente crear la FK al sincronizar
});

// Un sector tiene muchos usuarios
db.Sector.hasMany(db.User, {
  foreignKey: 'sectorId',
  as: 'users',
  constraints: false  // Importante: evita que Sequelize intente crear la FK al sincronizar
});
db.User.belongsTo(db.Sector, {
  foreignKey: 'sectorId',
  as: 'sector',
  constraints: false  // Importante: evita que Sequelize intente crear la FK al sincronizar
});

// Un doctor pertenece a un sector y a una especialidad
db.Sector.hasMany(db.Doctor, { foreignKey: 'sectorId', as: 'doctors' });
db.Doctor.belongsTo(db.Sector, { foreignKey: 'sectorId', as: 'sector' });

db.Specialty.hasMany(db.Doctor, { foreignKey: 'specialtyId', as: 'doctors' });
db.Doctor.belongsTo(db.Specialty, { foreignKey: 'specialtyId', as: 'specialty' });

// Un doctor tiene muchas citas, una cita pertenece a un doctor
db.Doctor.hasMany(db.Appointment, { foreignKey: 'doctorId', as: 'appointments' });
db.Appointment.belongsTo(db.Doctor, { foreignKey: 'doctorId', as: 'doctor' });

// Un paciente tiene muchas citas, una cita pertenece a un paciente
db.Patient.hasMany(db.Appointment, { foreignKey: 'patientId', as: 'appointments' });
db.Appointment.belongsTo(db.Patient, { foreignKey: 'patientId', as: 'patient' });

module.exports = db;
