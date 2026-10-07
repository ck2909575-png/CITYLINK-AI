const dns = require('dns');

dns.lookup('db.pmrbnwdhchgsbtelnwwu.supabase.co', (err, address, family) => {
  console.log('Direct DB host resolution:', err ? err.message : address);
});

dns.lookup('aws-0-us-east-1.pooler.supabase.com', (err, address, family) => {
  console.log('Pooler host resolution:', err ? err.message : address);
});
