
require('dotenv').config();
const sequelize = require('../config/database');
const migration = require('./009-add-profile-fields-to-users');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    const queryInterface = sequelize.getQueryInterface();
    await migration.up(queryInterface, sequelize.constructor);

    console.log('✅ Profile fields migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

run();
