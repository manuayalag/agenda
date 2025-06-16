const db = require('../models');
const Specialty = db.Specialty;

/**
 * Seeder para la creación de especialidades médicas
 */
const seedSpecialties = async () => {
  try {
    const specialties = [
      {
        name: 'Medicina General',
        description: 'Atención médica primaria y de rutina',
        active: true
      },
      {
        name: 'Cardiología',
        description: 'Diagnóstico y tratamiento de enfermedades del corazón',
        active: true
      },
      {
        name: 'Pediatría',
        description: 'Atención médica para niños y adolescentes',
        active: true
      },
      {
        name: 'Ginecología',
        description: 'Atención de la salud reproductiva femenina',
        active: true
      },
      {
        name: 'Traumatología',
        description: 'Diagnóstico y tratamiento de lesiones del sistema musculoesquelético',
        active: true
      },
      {
        name: 'Dermatología',
        description: 'Diagnóstico y tratamiento de enfermedades de la piel',
        active: true
      },
      {
        name: 'Oftalmología',
        description: 'Diagnóstico y tratamiento de enfermedades de los ojos',
        active: true
      },
      {
        name: 'Neurología',
        description: 'Diagnóstico y tratamiento de trastornos del sistema nervioso',
        active: true
      },
      {
        name: 'Psiquiatría',
        description: 'Diagnóstico y tratamiento de trastornos mentales',
        active: true
      },
      {
        name: 'Endocrinología',
        description: 'Diagnóstico y tratamiento de trastornos hormonales',
        active: true
      }
    ];

    await Specialty.bulkCreate(specialties);
    console.log('✅ Especialidades creadas exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error al crear especialidades:', error);
    throw error;
  }
};

module.exports = seedSpecialties;
