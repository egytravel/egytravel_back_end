'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('users');

    // Add is_verified if it doesn't exist yet
    if (!tableDescription.is_verified) {
      await queryInterface.addColumn('users', 'is_verified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        after: 'role'
      });
      console.log('✓ Added is_verified column to users table');
    } else {
      console.log('ℹ️  is_verified column already exists, skipping');
    }
  },

  down: async (queryInterface) => {
    const tableDescription = await queryInterface.describeTable('users');
    if (tableDescription.is_verified) {
      await queryInterface.removeColumn('users', 'is_verified');
    }
  }
};
