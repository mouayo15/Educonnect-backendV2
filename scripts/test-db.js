const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'educonnect',
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'educonnect'}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
    
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    
    console.log('\n✅ Database connection successful!');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${result.rows[0].version.split(',')[0]}`);
    
    // Test tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`\n📊 Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('\n⚠️  No tables found. Run "npm run migrate" to create the schema.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error(`   ${error.message}`);
    console.error('\n💡 Make sure:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. Database exists (CREATE DATABASE educonnect;)');
    console.error('   3. .env file is configured correctly');
    console.error('   4. User has proper permissions');
    process.exit(1);
  }
}

testConnection();
