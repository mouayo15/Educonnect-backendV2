const request = require('supertest');
const { pool } = require('../src/config/database');

// Test without starting the server
async function healthCheck() {
  console.log('\n🏥 EduConnect Backend Health Check\n');
  console.log('='.repeat(50));
  
  let allGood = true;

  // 1. Database Connection
  try {
    console.log('\n📊 Database Connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('   ✅ Database connected');
    console.log(`   ⏰ Current time: ${result.rows[0].now}`);
  } catch (error) {
    console.log('   ❌ Database connection failed');
    console.log(`   Error: ${error.message}`);
    allGood = false;
  }

  // 2. Tables Check
  try {
    console.log('\n📋 Database Tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const requiredTables = [
      'users', 'subjects', 'chapters', 'lessons', 'quizzes', 
      'quiz_questions', 'quiz_attempts', 'exercises', 
      'exercise_questions', 'exercise_attempts', 'achievements',
      'user_achievements', 'activity_history', 'refresh_tokens',
      'leaderboard_cache', 'lesson_completions'
    ];

    const existingTables = tables.rows.map(r => r.table_name);
    
    console.log(`   Found ${existingTables.length} tables`);
    
    requiredTables.forEach(tableName => {
      if (existingTables.includes(tableName)) {
        console.log(`   ✅ ${tableName}`);
      } else {
        console.log(`   ❌ ${tableName} MISSING`);
        allGood = false;
      }
    });
  } catch (error) {
    console.log('   ❌ Table check failed');
    console.log(`   Error: ${error.message}`);
    allGood = false;
  }

  // 3. Data Check
  try {
    console.log('\n📝 Sample Data...');
    
    const subjects = await pool.query('SELECT COUNT(*) FROM subjects');
    console.log(`   Subjects: ${subjects.rows[0].count}`);
    
    const quizzes = await pool.query('SELECT COUNT(*) FROM quizzes');
    console.log(`   Quizzes: ${quizzes.rows[0].count}`);
    
    const achievements = await pool.query('SELECT COUNT(*) FROM achievements');
    console.log(`   Achievements: ${achievements.rows[0].count}`);
    
    const users = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`   Users: ${users.rows[0].count}`);

    if (parseInt(subjects.rows[0].count) === 0) {
      console.log('   ⚠️  No data found. Run: npm run seed');
    } else {
      console.log('   ✅ Sample data loaded');
    }
  } catch (error) {
    console.log('   ❌ Data check failed');
    console.log(`   Error: ${error.message}`);
  }

  // 4. Environment Variables
  console.log('\n🔧 Environment Variables...');
  const envVars = [
    'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    'JWT_SECRET', 'JWT_REFRESH_SECRET', 'PORT', 'NODE_ENV'
  ];

  envVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}`);
    } else {
      console.log(`   ❌ ${varName} not set`);
      if (['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_PASSWORD'].includes(varName)) {
        allGood = false;
      }
    }
  });

  // 5. Dependencies
  console.log('\n📦 Dependencies...');
  try {
    require('express');
    console.log('   ✅ express');
    require('pg');
    console.log('   ✅ pg (PostgreSQL)');
    require('jsonwebtoken');
    console.log('   ✅ jsonwebtoken');
    require('bcryptjs');
    console.log('   ✅ bcryptjs');
    require('helmet');
    console.log('   ✅ helmet');
    require('cors');
    console.log('   ✅ cors');
    require('express-validator');
    console.log('   ✅ express-validator');
    require('express-rate-limit');
    console.log('   ✅ express-rate-limit');
  } catch (error) {
    console.log('   ❌ Missing dependencies');
    console.log('   Run: npm install');
    allGood = false;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('\n✅ All checks passed! Backend is ready.');
    console.log('\n🚀 Start the server with: npm run dev\n');
  } else {
    console.log('\n❌ Some checks failed. Please fix the issues above.\n');
    console.log('Common fixes:');
    console.log('  - Database: npm run migrate');
    console.log('  - Sample data: npm run seed');
    console.log('  - Environment: Copy .env.example to .env and configure');
    console.log('  - Dependencies: npm install\n');
  }

  await pool.end();
  process.exit(allGood ? 0 : 1);
}

healthCheck();
