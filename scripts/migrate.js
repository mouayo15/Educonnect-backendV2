const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'educonnect',
});

async function migrate() {
  try {
    console.log('🔄 Running database migrations...');
    
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schemaSQL);
    
    console.log('✅ Database schema created successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
