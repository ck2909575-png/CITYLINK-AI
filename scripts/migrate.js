/**
 * UrbanShield - Supabase Migration Runner
 * Applies 001_initial_schema.sql to Supabase and verifies tables.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pmrbnwdhchgsbtelnwwu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DATABASE_URL = process.env.DATABASE_URL;

async function run() {
  console.log('====================================================');
  console.log('🛡️  URBANSHIELD DATABASE MIGRATION RUNNER');
  console.log('====================================================');
  console.log(`Target Supabase URL: ${SUPABASE_URL}`);

  const sqlFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Migration file not found at: ${sqlFilePath}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlFilePath, 'utf8');
  console.log(`📄 Loaded migration file: 001_initial_schema.sql (${sql.length} bytes)`);

  // 1. If DATABASE_URL is provided, run with pg client
  if (DATABASE_URL) {
    console.log('🔗 Executing SQL via direct PostgreSQL connection (DATABASE_URL)...');
    try {
      const { Client } = require('pg');
      const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
      await client.connect();
      console.log('✅ Connected to PostgreSQL. Applying migration...');
      await client.query(sql);
      await client.end();
      console.log('🎉 Migration applied successfully via PostgreSQL!');
      return;
    } catch (err) {
      console.error(`⚠️ PostgreSQL connection error: ${err.message}`);
    }
  }

  // 2. Check current schema tables via Supabase PostgREST
  console.log('🔍 Checking Supabase PostgREST schema...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    const data = await res.json();
    const existingTables = Object.keys(data.definitions || {});
    console.log(`📊 Currently detected tables in Supabase:`, existingTables);

    const requiredTables = ['profiles', 'facilities', 'response_units', 'incidents', 'dispatch_logs'];
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length === 0) {
      console.log('✅ All UrbanShield tables exist in Supabase!');
    } else {
      console.log(`⚠️ Missing tables in Supabase PostgREST: ${missingTables.join(', ')}`);
      console.log('\n----------------------------------------------------');
      console.log('📋 INSTRUCTIONS TO APPLY SCHEMA TO SUPABASE CLOUD:');
      console.log('----------------------------------------------------');
      console.log('1. Open Supabase SQL Editor in your browser:');
      console.log(`   https://supabase.com/dashboard/project/pmrbnwdhchgsbtelnwwu/sql/new`);
      console.log('2. Copy the contents of:');
      console.log(`   ${sqlFilePath}`);
      console.log('3. Paste into the SQL Editor and click "RUN".');
      console.log('4. Alternatively, export DATABASE_URL with your database password:');
      console.log('   set DATABASE_URL=postgres://postgres.pmrbnwdhchgsbtelnwwu:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres');
      console.log('   npm run migrate');
      console.log('----------------------------------------------------\n');
    }
  } catch (err) {
    console.error(`⚠️ Schema check failed: ${err.message}`);
  }
}

run().catch(console.error);
