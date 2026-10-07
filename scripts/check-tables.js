require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pmrbnwdhchgsbtelnwwu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const REQUIRED_TABLES = [
  'profiles',
  'facilities',
  'response_units',
  'incidents',
  'dispatch_logs',
  'digital_signage',
  'audit_logs',
  'cameras',
  'camera_sessions',
  'camera_ai_events',
];

async function checkTables() {
  console.log('====================================================');
  console.log('🛡️  SUPABASE CLOUD TABLE VERIFICATION');
  console.log('====================================================');
  console.log(`🔗 Project URL: ${SUPABASE_URL}`);
  console.log('🔍 Checking PostgREST schema definitions...\n');

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    });

    if (!res.ok) {
      console.error(`❌ HTTP Error querying Supabase schema: ${res.status} ${res.statusText}`);
      return;
    }

    const data = await res.json();
    const existingTables = Object.keys(data.definitions || {});

    console.log('Table Status Report:');
    console.log('----------------------------------------------------');

    let allPresent = true;
    for (const table of REQUIRED_TABLES) {
      const exists = existingTables.includes(table);
      if (exists) {
        console.log(`  ✅ ${table.padEnd(20)} [PRESENT]`);
      } else {
        console.log(`  ❌ ${table.padEnd(20)} [MISSING]`);
        allPresent = false;
      }
    }

    console.log('----------------------------------------------------');
    if (allPresent) {
      console.log('🎉 SUCCESS: All UrbanShield tables are active in Supabase!');
    } else {
      console.log('⚠️  Tables are not yet created in your Supabase project.');
      console.log('\nTo add them:');
      console.log('1. Open: https://supabase.com/dashboard/project/pmrbnwdhchgsbtelnwwu/sql/new');
      console.log('2. Paste the SQL from: supabase/migrations/001_initial_schema.sql');
      console.log('3. Click "Run".');
    }
    console.log('====================================================\n');
  } catch (err) {
    console.error('Check failed:', err.message);
  }
}

checkTables();
