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
db.Prestador = require('./doctor.model')(sequelize, DataTypes);
db.Appointment = require('./appointment.model')(sequelize, DataTypes);
db.Servicio = require('./servicio.model')(sequelize, DataTypes);
db.PrestadorServicio = require('./prestador_servicio.model')(sequelize, DataTypes);
const PrestadorHorario = require('./prestador_horario.model')(sequelize, DataTypes);
db.PrestadorHorario = PrestadorHorario;
db.SeguroMedico = require('./seguro_medico.model')(sequelize, DataTypes);
db.PrestadorSeguro = require('./prestador_seguro.model')(sequelize, DataTypes);
db.ServicioSeguro = require('./servicio_seguro.model')(sequelize, DataTypes);
db.CoberturaSeguro = require('./cobertura_seguro.model')(sequelize, DataTypes);

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

// Relación User <-> Prestador (un usuario puede ser prestador)
db.User.hasOne(db.Prestador, { foreignKey: 'userId', as: 'prestadorProfile' });
db.Prestador.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

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

// Un prestador tiene muchas citas, una cita pertenece a un prestador
// (Solo una vez, no duplicar alias)
db.Prestador.hasMany(db.Appointment, { foreignKey: 'prestadorId', as: 'appointments' });
db.Appointment.belongsTo(db.Prestador, { foreignKey: 'prestadorId', as: 'prestador' });

// Un paciente tiene muchas citas, una cita pertenece a un paciente
db.Patient.hasMany(db.Appointment, { foreignKey: 'patientId', as: 'appointments' });
db.Appointment.belongsTo(db.Patient, { foreignKey: 'patientId', as: 'patient' });

// Relación muchos a muchos entre Prestador y Servicio
// Un prestador puede tener muchos servicios y un servicio puede ser realizado por muchos prestadores

db.Prestador.belongsToMany(db.Servicio, {
  through: db.PrestadorServicio,
  foreignKey: 'id_prestador',
  otherKey: 'id_servicio',
  as: 'servicios'
});
db.Servicio.belongsToMany(db.Prestador, {
  through: db.PrestadorServicio,
  foreignKey: 'id_servicio',
  otherKey: 'id_prestador',
  as: 'prestadores'
});

// Relación Appointment con Servicio
// (NO DUPLICAR la relación con prestador)
db.Appointment.belongsTo(db.Servicio, { foreignKey: 'servicioId', as: 'servicio' });

// Asociación Specialty <-> Prestador
// Un prestador pertenece a una especialidad
// Un specialty tiene muchos prestadores

db.Prestador.belongsTo(db.Specialty, { foreignKey: 'specialtyId', as: 'specialty' });
db.Specialty.hasMany(db.Prestador, { foreignKey: 'specialtyId', as: 'prestadores' });

// Asociación Sector <-> Prestador
// Un prestador pertenece a un sector
// Un sector tiene muchos prestadores

db.Prestador.belongsTo(db.Sector, { foreignKey: 'sectorId', as: 'sector' });
db.Sector.hasMany(db.Prestador, { foreignKey: 'sectorId', as: 'prestadores' });

// Relación: Un prestador tiene muchos horarios
db.Prestador.hasMany(db.PrestadorHorario, { foreignKey: 'prestadorId', as: 'horarios' });
db.PrestadorHorario.belongsTo(db.Prestador, { foreignKey: 'prestadorId', as: 'prestador' });

// Paciente pertenece a un seguro (opcional)
db.Patient.belongsTo(db.SeguroMedico, { foreignKey: 'id_seguro', as: 'seguro' });
db.SeguroMedico.hasMany(db.Patient, { foreignKey: 'id_seguro', as: 'pacientes' });

// Prestador <-> Seguro (muchos a muchos)
db.Prestador.belongsToMany(db.SeguroMedico, {
  through: db.PrestadorSeguro,
  foreignKey: 'id_prestador',
  otherKey: 'id_seguro',
  as: 'seguros'
});
db.SeguroMedico.belongsToMany(db.Prestador, {
  through: db.PrestadorSeguro,
  foreignKey: 'id_seguro',
  otherKey: 'id_prestador',
  as: 'prestadores'
});

// Seguro <-> Servicio (muchos a muchos)
db.SeguroMedico.belongsToMany(db.Servicio, {
  through: db.ServicioSeguro,
  foreignKey: 'id_seguro',
  otherKey: 'id_servicio',
  as: 'servicios'
});
db.Servicio.belongsToMany(db.SeguroMedico, {
  through: db.ServicioSeguro,
  foreignKey: 'id_servicio',
  otherKey: 'id_seguro',
  as: 'seguros'
});

// Cobertura: puedes acceder por db.CoberturaSeguro.findOne({ where: { id_seguro, id_servicio } })
db.Servicio.hasMany(db.CoberturaSeguro, { foreignKey: 'id_servicio', as: 'coberturas' });
db.CoberturaSeguro.belongsTo(db.Servicio, { foreignKey: 'id_servicio', as: 'servicio' });
db.CoberturaSeguro.belongsTo(db.SeguroMedico, { foreignKey: 'id_seguro', as: 'seguro' });

module.exports = db;
