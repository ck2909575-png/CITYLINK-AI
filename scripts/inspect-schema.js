require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pmrbnwdhchgsbtelnwwu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function inspectSchema() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  const data = await res.json();
  console.log('Definitions/Tables in DB:');
  console.log(Object.keys(data.definitions || {}));
  console.log('Paths in DB:');
  console.log(Object.keys(data.paths || {}));
}

inspectSchema().catch(console.error);
