'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('users');

    if (!tableDescription.phone) {
      await queryInterface.addColumn('users', 'phone', {
        type: Sequelize.STRING(30),
        allowNull: true
      });
    }

    if (!tableDescription.nationality) {
      await queryInterface.addColumn('users', 'nationality', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!tableDescription.date_of_birth) {
      await queryInterface.addColumn('users', 'date_of_birth', {
        type: Sequelize.DATEONLY,
        allowNull: true
      });
    }

    if (!tableDescription.profile_photo_url) {
      await queryInterface.addColumn('users', 'profile_photo_url', {
        type: Sequelize.STRING(500),
        allowNull: true
      });
    }

    if (!tableDescription.notification_preferences) {
      await queryInterface.addColumn('users', 'notification_preferences', {
        type: Sequelize.JSON,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('users');

    if (tableDescription.notification_preferences) {
      await queryInterface.removeColumn('users', 'notification_preferences');
    }
    if (tableDescription.profile_photo_url) {
      await queryInterface.removeColumn('users', 'profile_photo_url');
    }
    if (tableDescription.date_of_birth) {
      await queryInterface.removeColumn('users', 'date_of_birth');
    }
    if (tableDescription.nationality) {
      await queryInterface.removeColumn('users', 'nationality');
    }
    if (tableDescription.phone) {
      await queryInterface.removeColumn('users', 'phone');
    }
  }
};
