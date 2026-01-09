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

async function seed() {
  try {
    console.log('🌱 Seeding database...');
    
    const seedPath = path.join(__dirname, '../database/seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');
    
    await pool.query(seedSQL);
    
    console.log('✅ Database seeded successfully');
    console.log('\n📝 Test accounts created:');
    console.log('   - admin@educonnect.fr (password: admin123)');
    console.log('   - sarah@test.com (password: see seed.sql)');
    console.log('   - lucas@test.com');
    console.log('   - emma@test.com');
    console.log('   - maxime@test.com');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
