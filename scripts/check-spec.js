require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pmrbnwdhchgsbtelnwwu.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function checkSpec() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.paths, null, 2));
}

checkSpec();
