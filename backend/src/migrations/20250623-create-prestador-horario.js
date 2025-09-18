'use strict';

module.exports = {
  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  up: async (queryInterface, Sequelize) => {
    /**
     * La función 'up' se ejecuta cuando aplicas la migración.
     * Aquí añadimos la columna 'id_seguro' a la tabla 'patients'.
     */
    await queryInterface.addColumn('patients', 'id_seguro', {
      type: Sequelize.INTEGER,
      allowNull: true, // Permitir que sea nulo, ya que pacientes existentes no lo tendrán
      references: {
        model: 'seguros_medicos', // Nombre de la tabla a la que hace referencia
        key: 'id_seguro',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  /**
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  down: async (queryInterface, Sequelize) => {
    /**
     * La función 'down' se ejecuta si necesitas revertir la migración.
     * Aquí eliminamos la columna que agregamos.
     */
    await queryInterface.removeColumn('patients', 'id_seguro');
  }
};