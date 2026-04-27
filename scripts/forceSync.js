require('dotenv').config();
const sequelize = require('../src/config/database');
require('../src/models/sql/index');

async function forceSync() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    // force: true drops and recreates all tables
    await sequelize.sync({ force: true });
    console.log('✅ All tables recreated successfully');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}
forceSync();
