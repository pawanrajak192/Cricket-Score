import { pool } from './db.js';

async function checkSavedData() {
  try {
    console.log('🔍 Checking database for saved users...');
    
    const [users] = await pool.query('SELECT id, name, email, created_at FROM users;');
    
    if (users.length === 0) {
      console.log('⚠️ Database connected, but NO USERS found in the table yet.');
    } else {
      console.log(`🎉 Success! Found ${users.length} user(s) saved in MySQL:`);
      console.table(users); 
    }

    console.log('\n🔍 Checking database for saved matches...');
    const [matches] = await pool.query('SELECT * FROM matches;');
    console.log(`📊 Total matches saved: ${matches.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fetch data from MySQL:', error.message);
    process.exit(1);
  }
}

checkSavedData();
