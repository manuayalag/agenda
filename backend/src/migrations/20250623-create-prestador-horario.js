"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("prestador_horarios", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      prestadorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "prestadores",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      dia: {
        type: Sequelize.INTEGER, // 1=Lunes, 2=Martes, ..., 7=Domingo
        allowNull: false,
      },
      hora_inicio: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      hora_fin: {
        type: Sequelize.TIME,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("prestador_horarios");
  },
};
