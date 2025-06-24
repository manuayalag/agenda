// Seeder para poblar horarios de prestadores
const { Prestador, PrestadorHorario } = require('../models');

const horariosEjemplo = [
  // Prestador 1: Lunes 7-12 y 16-18, Martes 15-17
  {
    prestadorId: 1,
    horarios: [
      { dia: 1, hora_inicio: '07:00', hora_fin: '12:00' },
      { dia: 1, hora_inicio: '16:00', hora_fin: '18:00' },
      { dia: 2, hora_inicio: '15:00', hora_fin: '17:00' },
    ],
  },
  // Prestador 2: Miércoles 8-12
  {
    prestadorId: 2,
    horarios: [
      { dia: 3, hora_inicio: '08:00', hora_fin: '12:00' },
    ],
  },
];

async function seedPrestadorHorarios() {
  for (const prestador of horariosEjemplo) {
    for (const h of prestador.horarios) {
      await PrestadorHorario.create({
        prestadorId: prestador.prestadorId,
        dia: h.dia,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
      });
    }
  }
  console.log('Horarios de prestadores creados correctamente');
}

module.exports = seedPrestadorHorarios;
