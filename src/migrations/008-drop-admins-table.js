'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop admins table as it's redundant with users.role
    await queryInterface.dropTable('admins');
    console.log('✓ Dropped admins table (redundant with users.role)');
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate admins table if needed to rollback
    await queryInterface.createTable('admins', {
      admin_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  }
};
