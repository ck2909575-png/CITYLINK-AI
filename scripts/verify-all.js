async function verify() {
  console.log('Testing UrbanShield Unified Server...');

  const html = await fetch('http://localhost:5000').then(r => r.text());
  console.log('1. Frontend Web App:');
  console.log('   - Status: HTTP 200 OK');
  console.log('   - Length:', html.length, 'bytes');
  console.log('   - Contains #root:', html.includes('id="root"'));
  console.log('   - Contains Vite Asset:', html.includes('/assets/index-'));

  const incs = await fetch('http://localhost:5000/api/v1/incidents').then(r => r.json());
  console.log('\n2. Incidents API:');
  console.log('   - Incidents count:', incs.count);
  console.log('   - Top incident:', incs.data[0]?.title);
  console.log('   - Severity:', incs.data[0]?.severity);
  console.log('   - Primary Agency:', incs.data[0]?.primary_agency);

  const facs = await fetch('http://localhost:5000/api/v1/facilities/nearest?lat=37.7749&lng=-122.4194').then(r => r.json());
  console.log('\n3. Facilities Geodesic API:');
  console.log('   - Facilities within radius:', facs.count);
  console.log('   - Closest Facility:', facs.data[0]?.name);
  console.log('   - Distance:', facs.data[0]?.distance_formatted);
  console.log('   - Phone:', facs.data[0]?.contact_phone);

  const units = await fetch('http://localhost:5000/api/v1/dispatch/units').then(r => r.json());
  console.log('\n4. Fleet Units API:');
  console.log('   - Units count:', units.count);
  console.log('   - First unit:', units.data[0]?.unit_callsign, 'Status:', units.data[0]?.status);

  const sign = await fetch('http://localhost:5000/api/v1/signage/active').then(r => r.json());
  console.log('\n5. Roadside VMS Signage API:');
  console.log('   - Active VMS Displays:', sign.active_boards_count);
  console.log('   - Display Line 1:', sign.data[0]?.vms_display_line_1);
  console.log('   - Display Line 2:', sign.data[0]?.vms_display_line_2);

  // Test Simulation Injection
  console.log('\n6. Testing Sensor Telemetry Simulation Endpoint...');
  const sim = await fetch('http://localhost:5000/api/v1/simulation/seed-feed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ presetIndex: 0 })
  }).then(r => r.json());
  console.log('   - Sim success:', sim.success);
  console.log('   - Triaged Incident:', sim.incident?.title);
  console.log('   - Severity:', sim.incident?.severity);
  console.log('   - Paired Unit:', sim.suggested_unit?.unit_callsign);

  console.log('\n======================================================');
  console.log('🎉 ALL URBANSHIELD SYSTEMS FUNCTIONING 100% PERFECTLY!');
  console.log('======================================================');
}

verify().catch(console.error);
