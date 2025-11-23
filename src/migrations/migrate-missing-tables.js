const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');

async function checkTableExists(tableName) {
  try {
    const [results] = await sequelize.query(
      `SHOW TABLES LIKE '${tableName}'`
    );
    return results.length > 0;
  } catch (error) {
    return false;
  }
}

async function runMissingMigrations() {
  try {
    console.log('Checking for missing tables...\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    const migrations = [
      { file: '003-create-trips.js', table: 'trips' },
      { file: '004-create-trip-days.js', table: 'trip_days' },
      { file: '005-create-bookings.js', table: 'bookings' },
      { file: '006-create-favorites.js', table: 'favorites' },
      { file: '007-create-feedback.js', table: 'feedback' }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const { file, table } of migrations) {
      const exists = await checkTableExists(table);
      
      if (exists) {
        console.log(`⊘ Skipping ${table} (already exists)`);
        skippedCount++;
        continue;
      }

      console.log(`→ Creating ${table}...`);
      const migration = require(`./${file}`);
      
      try {
        await migration.up(sequelize.getQueryInterface(), Sequelize);
        console.log(`✓ Created ${table} successfully\n`);
        createdCount++;
      } catch (error) {
        console.error(`✗ Failed to create ${table}:`, error.message);
        throw error;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Summary:`);
    console.log(`  Created: ${createdCount} tables`);
    console.log(`  Skipped: ${skippedCount} tables (already exist)`);
    console.log('='.repeat(50));
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

runMissingMigrations();
