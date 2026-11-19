import { buildServer } from '../server/index.js';
import { seedDatabase } from '../db/seed.js';

async function runSmokeTests() {
  console.log('=== SaathiBus Backend End-to-End Smoke Verification ===\n');
  seedDatabase();
  const server = await buildServer();

  let passCount = 0;
  const total = 6;

  try {
    // 1. Health check
    const healthRes = await server.inject({ method: 'GET', url: '/api/health' });
    if (healthRes.statusCode === 200) {
      console.log('[PASS] 1. GET /api/health -> 200 OK');
      passCount++;
    } else {
      console.log(`[FAIL] 1. GET /api/health -> ${healthRes.statusCode}`);
    }

    // 2. Stops list
    const stopsRes = await server.inject({ method: 'GET', url: '/api/stops?q=salt' });
    const stops = JSON.parse(stopsRes.body);
    if (stopsRes.statusCode === 200 && stops.length > 0) {
      console.log(`[PASS] 2. GET /api/stops?q=salt -> Found ${stops.length} stops (${stops[0].name})`);
      passCount++;
    } else {
      console.log(`[FAIL] 2. GET /api/stops -> ${stopsRes.statusCode}`);
    }

    // 3. Search with nearest-time
    const today = new Date().toISOString().split('T')[0];
    const searchRes = await server.inject({
      method: 'GET',
      url: `/api/search?from=Esplanade&to=Salt Lake Sector V&date=${today}&time=09:00`
    });
    const searchData = JSON.parse(searchRes.body);
    if (searchRes.statusCode === 200 && searchData.before && searchData.after) {
      console.log(`[PASS] 3. GET /api/search -> Nearest Before: ${searchData.before.departs}, Nearest After: ${searchData.after.departs}`);
      passCount++;
    } else {
      console.log(`[FAIL] 3. GET /api/search -> ${searchRes.statusCode}`);
    }

    // 4. Create booking
    const targetTrip = searchData.before || searchData.after;
    const bkgRes = await server.inject({
      method: 'POST',
      url: '/api/bookings',
      headers: { 'x-user-id': 'usr_asha' },
      payload: {
        tripId: targetTrip.id,
        fromStop: 'Esplanade',
        toStop: 'Salt Lake Sector V',
        needs: ['visual'],
        guideDog: true
      }
    });
    const bkgData = JSON.parse(bkgRes.body);
    if (bkgRes.statusCode === 201 && bkgData.code) {
      console.log(`[PASS] 4. POST /api/bookings -> Created Booking Pass: ${bkgData.code}`);
      passCount++;
    } else {
      console.log(`[FAIL] 4. POST /api/bookings -> ${bkgRes.statusCode}`);
    }

    // 5. Conductor alerts & acknowledgement
    const alertsRes = await server.inject({ method: 'GET', url: '/api/conductor/alerts' });
    const alertsData = JSON.parse(alertsRes.body);
    if (alertsRes.statusCode === 200 && alertsData.length > 0) {
      const topAlert = alertsData[0];
      const ackRes = await server.inject({ method: 'POST', url: `/api/conductor/alerts/${topAlert.id}/ack` });
      if (ackRes.statusCode === 200) {
        console.log(`[PASS] 5. Conductor Alert -> Dispatched & Acknowledged alert: ${topAlert.id}`);
        passCount++;
      } else {
        console.log(`[FAIL] 5. Conductor Alert ACK -> ${ackRes.statusCode}`);
      }
    } else {
      console.log(`[FAIL] 5. GET /api/conductor/alerts -> ${alertsRes.statusCode}`);
    }

    // 6. Voice assistant message
    const assistRes = await server.inject({
      method: 'POST',
      url: '/api/assistant/message',
      payload: {
        text: 'I want to travel from Esplanade to Salt Lake tomorrow at 9 AM',
        language: 'en'
      }
    });
    const assistData = JSON.parse(assistRes.body);
    if (assistRes.statusCode === 200 && assistData.intent) {
      console.log(`[PASS] 6. POST /api/assistant/message -> Intent: ${assistData.intent} | Reply: "${assistData.reply_text.slice(0, 40)}..."`);
      passCount++;
    } else {
      console.log(`[FAIL] 6. POST /api/assistant/message -> ${assistRes.statusCode}`);
    }

  } catch (err) {
    console.error('Smoke test exception:', err);
  } finally {
    await server.close();
  }

  console.log(`\n=== Verification Result: ${passCount}/${total} PASSED ===\n`);
  if (passCount !== total) process.exit(1);
}

runSmokeTests();
