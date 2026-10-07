require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pmrbnwdhchgsbtelnwwu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function testSupabase() {
  console.log('Testing Supabase connectivity...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  console.log('Status:', res.status, res.statusText);
  const text = await res.text();
  console.log('Response:', text.substring(0, 300));
}

testSupabase().catch(console.error);
