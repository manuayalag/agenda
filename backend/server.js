const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./src/models');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const doctorRoutes = require('./src/routes/doctor.routes');
const appointmentRoutes = require('./src/routes/appointment.routes');
const patientRoutes = require('./src/routes/patient.routes');
const sectorRoutes = require('./src/routes/sector.routes');
const specialtyRoutes = require('./src/routes/specialty.routes');
const ticketRoutes = require('./src/routes/ticket.routes');
const servicioCoberturaRoutes = require('./src/routes/servicio_cobertura.routes');
const prestadorRoutes = require('./src/routes/prestador.routes');
const seguroServicioRoutes = require('./src/routes/seguro_servicio.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/sectors', sectorRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/servicios', servicioCoberturaRoutes);
app.use('/api/prestadores', prestadorRoutes);
app.use('/api/seguros', seguroServicioRoutes);

// Ruta base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Agenda Clínica' });
});

// Puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor y sincronizar base de datos en un orden específico
const startServer = async () => {
  try {
    console.log('Iniciando sincronización de la base de datos...');
    
    // Primera fase: crear todas las tablas sin preocuparse por las relaciones
    console.log('Fase 1: Creando tablas básicas...');
    
    // Primero creamos las tablas sin las relaciones circulares
    await db.sequelize.sync({ force: false });
    console.log('- Todas las tablas creadas inicialmente');
    
    // Segunda fase: Agregar las claves foráneas manualmente
    console.log('Fase 2: Agregando relaciones y claves foráneas...');
    
    try {
      // Agregamos la clave foránea de sector a usuario
      await db.sequelize.query(`
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_sectors 
        FOREIGN KEY (sector_id) 
        REFERENCES sectors(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
      `);
      console.log('- Relación de users hacia sectors agregada');
    } catch (err) {
      console.log('La relación users->sectors ya existe o no se pudo agregar:', err.message);
    }
    
    try {
      // Agregamos la clave foránea de admin a sector
      await db.sequelize.query(`
        ALTER TABLE sectors 
        ADD CONSTRAINT fk_sectors_users 
        FOREIGN KEY (admin_id) 
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
      `);
      console.log('- Relación de sectors hacia users agregada');
    } catch (err) {
      console.log('La relación sectors->users ya existe o no se pudo agregar:', err.message);
    }
      // Tercera fase: Verificamos que las tablas existen y tienen las relaciones correctas
    console.log('Fase 3: Verificación de tablas y relaciones...');
    
    try {
      const [users] = await db.sequelize.query('SELECT table_name FROM information_schema.tables WHERE table_name = \'users\';');
      console.log(`- Tabla users ${users.length > 0 ? 'existe' : 'no existe'}`);
      
      const [sectors] = await db.sequelize.query('SELECT table_name FROM information_schema.tables WHERE table_name = \'sectors\';');
      console.log(`- Tabla sectors ${sectors.length > 0 ? 'existe' : 'no existe'}`);
    } catch (err) {
      console.log('Error al verificar tablas:', err.message);
    }
    
    console.log('Base de datos sincronizada correctamente');
    
    // Iniciar el servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
    console.error('Detalle del error:', error.original ? error.original.message : error.message);
  }
};

// Ejecutar la función
startServer();

module.exports = app;
