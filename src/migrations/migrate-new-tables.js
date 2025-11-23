const sequelize = require('../config/database');
const path = require('path');
const { Sequelize } = require('sequelize');

async function runNewMigrations() {
  try {
    console.log('Starting new table migrations...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Get only new migration files (003-007)
    const migrationFiles = [
      '003-create-trips.js',
      '004-create-trip-days.js',
      '005-create-bookings.js',
      '006-create-favorites.js',
      '007-create-feedback.js'
    ];

    console.log(`Found ${migrationFiles.length} new migration files`);

    // Run each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migration = require(path.join(__dirname, file));
      
      try {
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        console.log(`✓ Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`✗ Migration ${file} failed:`, error.message);
        throw error;
      }
    }

    console.log('\n✓ All new migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

runNewMigrations();
