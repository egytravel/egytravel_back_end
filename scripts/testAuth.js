require('dotenv').config();
const { User } = require('../src/models/sql');
const AuthService = require('../src/services/authService');

async function test() {
  try {
    console.log('Testing DB connection...');
    const count = await User.count();
    console.log('Users in DB:', count);

    console.log('Testing registration...');
    const result = await AuthService.register({
      name: 'Test User',
      email: `test_${Date.now()}@test.com`,
      password: 'TestPass123!',
      role: 'user'
    });
    console.log('Registration success:', result.user.email);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
    process.exit(1);
  }
}
test();
