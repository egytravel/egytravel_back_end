const sequelize = require('../config/database');

(async () => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query('SHOW TABLES');
    
    console.log('\n📊 Current Database Tables:\n');
    console.log('='.repeat(50));
    results.forEach((r, i) => {
      console.log(`${(i+1).toString().padStart(2)}. ${Object.values(r)[0]}`);
    });
    console.log('='.repeat(50));
    console.log(`\nTotal: ${results.length} tables\n`);
    
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
