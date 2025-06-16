const db = require('../models');
const Patient = db.Patient;

/**
 * Seeder para la creación de pacientes de ejemplo
 */
const seedPatients = async () => {
  try {
    const patients = [
      {
        fullName: 'Juan Pérez Rodríguez',
        documentId: '1234567890',
        dateOfBirth: '1980-05-15',
        gender: 'M',
        address: 'Calle Principal 123, Ciudad',
        phone: '555-123-4567',
        email: 'jperez@example.com',
        insurance: 'Seguro Nacional',
        insuranceNumber: 'SN-98765',
        allergies: 'Penicilina, Aspirina',
        medicalHistory: 'Hipertensión arterial, controlada con medicación',
        active: true
      },
      {
        fullName: 'María González Martínez',
        documentId: '0987654321',
        dateOfBirth: '1975-11-20',
        gender: 'F',
        address: 'Avenida Central 456, Ciudad',
        phone: '555-234-5678',
        email: 'mgonzalez@example.com',
        insurance: 'Seguro Privado',
        insuranceNumber: 'SP-54321',
        allergies: 'Ninguna conocida',
        medicalHistory: 'Diabetes tipo 2, controlada con dieta',
        active: true
      },
      {
        fullName: 'Carlos Ramírez Soto',
        documentId: '5678901234',
        dateOfBirth: '1990-07-10',
        gender: 'M',
        address: 'Paseo de las Flores 789, Ciudad',
        phone: '555-345-6789',
        email: 'cramirez@example.com',
        insurance: 'Seguro Estatal',
        insuranceNumber: 'SE-12345',
        allergies: 'Polen, ácaros',
        medicalHistory: 'Asma bronquial, episodios leves',
        active: true
      },
      {
        fullName: 'Ana Luisa Mendoza',
        documentId: '6543210987',
        dateOfBirth: '1985-03-25',
        gender: 'F',
        address: 'Bulevar Principal 321, Ciudad',
        phone: '555-456-7890',
        email: 'amendoza@example.com',
        insurance: 'Seguro Nacional',
        insuranceNumber: 'SN-24680',
        allergies: 'Sulfamidas',
        medicalHistory: 'Hipotiroidismo, en tratamiento',
        active: true
      },
      {
        fullName: 'Pedro Castillo Vega',
        documentId: '9876543210',
        dateOfBirth: '1970-09-05',
        gender: 'M',
        address: 'Calle Secundaria 654, Ciudad',
        phone: '555-567-8901',
        email: 'pcastillo@example.com',
        insurance: 'Seguro Privado',
        insuranceNumber: 'SP-13579',
        allergies: 'Mariscos',
        medicalHistory: 'Hipertensión, colesterol elevado',
        active: true
      },
      {
        fullName: 'Laura Jiménez Lobo',
        documentId: '3456789012',
        dateOfBirth: '1995-12-15',
        gender: 'F',
        address: 'Avenida Diagonal 987, Ciudad',
        phone: '555-678-9012',
        email: 'ljimenez@example.com',
        insurance: 'Seguro Universitario',
        insuranceNumber: 'SU-97531',
        allergies: 'Ninguna',
        medicalHistory: 'Migraña ocasional',
        active: true
      },
      {
        fullName: 'Roberto Salazar Mora',
        documentId: '8901234567',
        dateOfBirth: '1965-04-30',
        gender: 'M',
        address: 'Plaza Mayor 159, Ciudad',
        phone: '555-789-0123',
        email: 'rsalazar@example.com',
        insurance: 'Seguro Nacional',
        insuranceNumber: 'SN-86420',
        allergies: 'Penicilina',
        medicalHistory: 'Artritis, hernia discal L4-L5',
        active: true
      },
      {
        fullName: 'Sofía Torres Blanco',
        documentId: '4567890123',
        dateOfBirth: '2000-01-10',
        gender: 'F',
        address: 'Calle del Río 753, Ciudad',
        phone: '555-890-1234',
        email: 'storres@example.com',
        insurance: 'Seguro Estudiantil',
        insuranceNumber: 'SE-75319',
        allergies: 'Frutos secos',
        medicalHistory: 'Asma leve, rinitis alérgica',
        active: true
      }
    ];

    await Patient.bulkCreate(patients);
    console.log('✅ Pacientes creados exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al crear pacientes:', error);
    throw error;
  }
};

module.exports = seedPatients;
