require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pmrbnwdhchgsbtelnwwu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function testSqlEndpoints() {
  const endpoints = [
    { url: `${SUPABASE_URL}/pg/query`, body: { query: 'SELECT 1 as num;' } },
    { url: `${SUPABASE_URL}/rest/v1/rpc/exec_sql`, body: { sql: 'SELECT 1 as num;' } },
    { url: `${SUPABASE_URL}/rest/v1/rpc/exec`, body: { query: 'SELECT 1 as num;' } },
    { url: `https://api.supabase.com/v1/projects/pmrbnwdhchgsbtelnwwu/database/query`, body: { query: 'SELECT 1 as num;' } },
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ep.body)
      });
      const text = await res.text();
      console.log(`${ep.url} -> ${res.status}: ${text.substring(0, 150)}`);
    } catch (e) {
      console.log(`${ep.url} -> Error: ${e.message}`);
    }
  }
}

testSqlEndpoints();
