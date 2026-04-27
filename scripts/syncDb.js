require('dotenv').config();
const { syncDatabase } = require('../src/models/sql/index');

syncDatabase()
  .then(() => { console.log('✅ Database tables synced successfully'); process.exit(0); })
  .catch(e => { console.error('❌ Sync failed:', e.message); process.exit(1); });
