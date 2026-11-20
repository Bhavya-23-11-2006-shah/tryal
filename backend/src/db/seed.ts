import { getDb } from './index.js';
import crypto from 'node:crypto';
import { logger } from '../lib/logger.js';
import { encryptText } from '../lib/crypto.js';
import { getKolkataDateString } from '../lib/time.js';

export function seedDatabase(): void {
  const db = getDb();
  logger.info('Seeding database with accessible transit data...');

  // Clear existing data safely
  db.exec(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM booking_events;
    DELETE FROM alerts;
    DELETE FROM sos_events;
    DELETE FROM bookings;
    DELETE FROM waitlist;
    DELETE FROM trip_seats;
    DELETE FROM seats;
    DELETE FROM shifts;
    DELETE FROM trips;
    DELETE FROM buses;
    DELETE FROM route_stops;
    DELETE FROM routes;
    DELETE FROM stops;
    DELETE FROM conductors;
    DELETE FROM users;
    DELETE FROM audit_log;
    PRAGMA foreign_keys = ON;
  `);

  // 1. 12 Kolkata stops
  const stops = [
    { id: 'stop_esp', name: 'Esplanade', name_hi: 'एस्प्लेनेड', name_bn: 'এসপ্ল্যানেড', lat: 22.5658, lng: 88.3518 },
    { id: 'stop_how', name: 'Howrah Station', name_hi: 'हावड़ा स्टेशन', name_bn: 'হাওড়া স্টেশন', lat: 22.5850, lng: 88.3426 },
    { id: 'stop_slv', name: 'Salt Lake Sector V', name_hi: 'सॉल्ट लेक सेक्टर 5', name_bn: 'সল্টলেক সেক্টর ৫', lat: 22.5735, lng: 88.4331 },
    { id: 'stop_sea', name: 'Sealdah', name_hi: 'सियालदह', name_bn: 'শিয়ালদহ', lat: 22.5684, lng: 88.3712 },
    { id: 'stop_pst', name: 'Park Street', name_hi: 'पार्क स्ट्रीट', name_bn: 'পার্ক স্ট্রিট', lat: 22.5518, lng: 88.3524 },
    { id: 'stop_gar', name: 'Gariahat', name_hi: 'गड़ियाहाट', name_bn: 'গড়িয়াহাট', lat: 22.5186, lng: 88.3653 },
    { id: 'stop_air', name: 'Airport Gate 1', name_hi: 'हवाई अड्डा गेट 1', name_bn: 'বিমানবন্দর গেট ১', lat: 22.6547, lng: 88.4467 },
    { id: 'stop_dum', name: 'Dum Dum Junction', name_hi: 'दम दम जंक्शन', name_bn: 'দমদম জংশন', lat: 22.6214, lng: 88.3934 },
    { id: 'stop_rub', name: 'Ruby Hospital', name_hi: 'रूबी अस्पताल', name_bn: 'রুবি হাসপাতাল', lat: 22.5134, lng: 88.4029 },
    { id: 'stop_sci', name: 'Science City', name_hi: 'साइंस सिटी', name_bn: 'সায়েন্স সিটি', lat: 22.5401, lng: 88.3965 },
    { id: 'stop_new', name: 'New Town Bus Terminus', name_hi: 'न्यू टाउन बस टर्मिनल', name_bn: 'নিউ টাউন বাস টার্মিনাস', lat: 22.5898, lng: 88.4699 },
    { id: 'stop_beh', name: 'Behala Chowrasta', name_hi: 'बेहाला चौरास्ता', name_bn: 'বেহালা চৌরাস্তা', lat: 22.4975, lng: 88.3182 }
  ];

  const insertStop = db.prepare('INSERT INTO stops (id, name, name_hi, name_bn, lat, lng) VALUES (?, ?, ?, ?, ?, ?)');
  for (const s of stops) {
    insertStop.run(s.id, s.name, s.name_hi, s.name_bn, s.lat, s.lng);
  }

  // 2. 6 Routes
  const routes = [
    { id: 'route_12', number: 'Line 12', name: 'Esplanade to Salt Lake Sec V', direction: 'North-East' },
    { id: 'route_12R', number: 'Line 12R', name: 'Salt Lake Sec V to Esplanade', direction: 'South-West' },
    { id: 'route_AC4', number: 'Line AC-4', name: 'Howrah to Airport Gate 1', direction: 'North' },
    { id: 'route_AC4R', number: 'Line AC-4R', name: 'Airport Gate 1 to Howrah', direction: 'South' },
    { id: 'route_21', number: 'Line 21', name: 'Behala to New Town via Ruby', direction: 'East' },
    { id: 'route_33', number: 'Line 33', name: 'Park Street to Science City', direction: 'East' }
  ];

  const insertRoute = db.prepare('INSERT INTO routes (id, number, name, direction) VALUES (?, ?, ?, ?)');
  for (const r of routes) insertRoute.run(r.id, r.number, r.name, r.direction);

  // Route stops sequence with travel offset minutes
  const routeStopsData: Record<string, { stop_id: string; offset_min: number }[]> = {
    route_12: [
      { stop_id: 'stop_esp', offset_min: 0 },
      { stop_id: 'stop_sea', offset_min: 12 },
      { stop_id: 'stop_sci', offset_min: 24 },
      { stop_id: 'stop_slv', offset_min: 38 }
    ],
    route_12R: [
      { stop_id: 'stop_slv', offset_min: 0 },
      { stop_id: 'stop_sci', offset_min: 14 },
      { stop_id: 'stop_sea', offset_min: 26 },
      { stop_id: 'stop_esp', offset_min: 38 }
    ],
    route_AC4: [
      { stop_id: 'stop_how', offset_min: 0 },
      { stop_id: 'stop_esp', offset_min: 10 },
      { stop_id: 'stop_dum', offset_min: 28 },
      { stop_id: 'stop_air', offset_min: 45 }
    ],
    route_AC4R: [
      { stop_id: 'stop_air', offset_min: 0 },
      { stop_id: 'stop_dum', offset_min: 17 },
      { stop_id: 'stop_esp', offset_min: 35 },
      { stop_id: 'stop_how', offset_min: 45 }
    ],
    route_21: [
      { stop_id: 'stop_beh', offset_min: 0 },
      { stop_id: 'stop_gar', offset_min: 18 },
      { stop_id: 'stop_rub', offset_min: 30 },
      { stop_id: 'stop_new', offset_min: 52 }
    ],
    route_33: [
      { stop_id: 'stop_pst', offset_min: 0 },
      { stop_id: 'stop_sea', offset_min: 15 },
      { stop_id: 'stop_sci', offset_min: 32 }
    ]
  };

  const insertRouteStop = db.prepare('INSERT INTO route_stops (route_id, stop_id, seq, offset_min) VALUES (?, ?, ?, ?)');
  for (const [routeId, stopsList] of Object.entries(routeStopsData)) {
    stopsList.forEach((s, idx) => {
      insertRouteStop.run(routeId, s.stop_id, idx + 1, s.offset_min);
    });
  }

  // 3. 14 Buses with accessibility features
  const busesData = [
    { id: 'bus_101', reg_no: 'WB-01-A-1001', route_id: 'route_12', features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true } },
    { id: 'bus_102', reg_no: 'WB-01-A-1002', route_id: 'route_12', features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true } },
    { id: 'bus_103', reg_no: 'WB-01-A-1003', route_id: 'route_12', features: { low_floor: true, ramp: false, wheelchair_bays: 0, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: false, guide_dog_space: false } },
    { id: 'bus_104', reg_no: 'WB-01-A-1004', route_id: 'route_12R', features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true } },
    { id: 'bus_105', reg_no: 'WB-01-A-1005', route_id: 'route_12R', features: { low_floor: true, ramp: true, wheelchair_bays: 1, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true } },
    { id: 'bus_201', reg_no: 'WB-02-B-2001', route_id: 'route_AC4', features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 6, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true } },
    { id: 'bus_202', reg_no: 'WB-02-B-2002', route_id: 'route_AC4', features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 6, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true } },
    { id: 'bus_203', reg_no: 'WB-02-B-2003', route_id: 'route_AC4R', features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 6, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true } },
    { id: 'bus_301', reg_no: 'WB-03-C-3001', route_id: 'route_21', features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true } },
    { id: 'bus_302', reg_no: 'WB-03-C-3002', route_id: 'route_21', features: { low_floor: true, ramp: true, wheelchair_bays: 1, priority_seats: 4, audio_announce: true, visual_display: false, tactile_signs: false, guide_dog_space: true } },
    { id: 'bus_401', reg_no: 'WB-04-D-4001', route_id: 'route_33', features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true } },
    { id: 'bus_402', reg_no: 'WB-04-D-4002', route_id: 'route_33', features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true } },
    { id: 'bus_501', reg_no: 'WB-05-E-5001', route_id: 'route_12', features: { low_floor: false, ramp: false, wheelchair_bays: 0, priority_seats: 2, audio_announce: false, visual_display: false, tactile_signs: false, guide_dog_space: false } },
    { id: 'bus_502', reg_no: 'WB-05-E-5002', route_id: 'route_AC4', features: { low_floor: false, ramp: false, wheelchair_bays: 0, priority_seats: 2, audio_announce: false, visual_display: false, tactile_signs: false, guide_dog_space: false } }
  ];

  const insertBus = db.prepare('INSERT INTO buses (id, reg_no, route_id, features) VALUES (?, ?, ?, ?)');
  const insertSeat = db.prepare('INSERT INTO seats (id, bus_id, label, kind) VALUES (?, ?, ?, ?)');

  for (const b of busesData) {
    insertBus.run(b.id, b.reg_no, b.route_id, JSON.stringify(b.features));

    // Create seats per bus
    const bays = b.features.wheelchair_bays;
    for (let i = 1; i <= bays; i++) {
      insertSeat.run(`${b.id}_bay_${i}`, b.id, `Wheelchair Bay ${i}`, 'wheelchair_bay');
    }
    const priority = b.features.priority_seats;
    for (let i = 1; i <= priority; i++) {
      insertSeat.run(`${b.id}_pri_${i}`, b.id, `Priority Seat ${i}`, 'priority_seat');
    }
    // Companion seats
    insertSeat.run(`${b.id}_comp_1`, b.id, 'Companion Seat 1', 'companion');
    insertSeat.run(`${b.id}_comp_2`, b.id, 'Companion Seat 2', 'companion');

    // Standard seats
    for (let i = 1; i <= 16; i++) {
      insertSeat.run(`${b.id}_reg_${i}`, b.id, `Seat ${i}`, 'regular');
    }
  }

  // 4. Trips for today and next 7 days
  const today = new Date();
  const insertTrip = db.prepare('INSERT INTO trips (id, route_id, bus_id, service_date, scheduled_departs, status, delay_min, crowd_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertTripSeat = db.prepare('INSERT INTO trip_seats (trip_id, seat_id, state) VALUES (?, ?, ?)');
  const getBusSeats = db.prepare('SELECT id, kind FROM seats WHERE bus_id = ?');

  // Times with deliberate gaps to showcase nearest-before & nearest-after logic
  // e.g., 07:15, 08:42, 09:25, 10:15, 11:30, 13:00, 14:15, 15:45, 17:10, 18:30, 20:00, 21:40
  const scheduleTimes = ['07:15', '08:42', '09:25', '10:15', '11:30', '13:00', '14:15', '15:45', '17:10', '18:30', '20:00', '21:40'];

  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const dateStr = getKolkataDateString(dayOffset);

    routes.forEach((route, rIndex) => {
      // Pick matching buses for route
      const routeBuses = busesData.filter(b => b.route_id === route.id);
      if (routeBuses.length === 0) return;

      scheduleTimes.forEach((time, tIndex) => {
        const bus = routeBuses[tIndex % routeBuses.length];
        const tripId = `trip_${route.id}_${dateStr}_${time.replace(':', '')}`;
        
        let status = 'scheduled';
        let delayMin = 0;
        let crowdLevel = 'moderate';

        // Deliberate test conditions:
        if (dayOffset === 0 && time === '08:42') {
          delayMin = 5; // 5 min delayed
        }
        if (dayOffset === 0 && time === '14:15' && route.id === 'route_AC4') {
          status = 'cancelled'; // Cancelled trip test case
        }
        if (time === '17:10') {
          crowdLevel = 'high';
        }

        insertTrip.run(tripId, route.id, bus.id, dateStr, time, status, delayMin, crowdLevel);

        // Populate trip_seats
        const seats = getBusSeats.all(bus.id) as { id: string; kind: string }[];
        seats.forEach((seat, sIndex) => {
          let state = 'free';
          // Make trip_route_12 on 09:25 have 1 wheelchair bay booked for demonstration
          if (time === '09:25' && seat.kind === 'wheelchair_bay' && sIndex === 0) {
            state = 'booked';
          }
          // Make 11:30 fully booked for test case
          if (time === '11:30' && seat.kind === 'wheelchair_bay') {
            state = 'booked';
          }
          insertTripSeat.run(tripId, seat.id, state);
        });
      });
    });
  }

  // 5. Conductors (demo code 1234)
  const shiftHash = crypto.createHash('sha256').update('1234').digest('hex');
  const conductors = [
    { id: 'cond_1', name: 'Subhashish Das', bus_id: 'bus_101', shift_code_hash: shiftHash },
    { id: 'cond_2', name: 'Rabin Roy', bus_id: 'bus_102', shift_code_hash: shiftHash },
    { id: 'cond_3', name: 'Alok Mukherjee', bus_id: 'bus_201', shift_code_hash: shiftHash }
  ];
  const insertConductor = db.prepare('INSERT INTO conductors (id, name, bus_id, shift_code_hash) VALUES (?, ?, ?, ?)');
  for (const c of conductors) insertConductor.run(c.id, c.name, c.bus_id, c.shift_code_hash);

  // 6. 4 Demo Passengers
  const demoUsers = [
    {
      id: 'usr_asha',
      phone: '9800000001',
      name: 'Asha Sharma',
      role: 'passenger',
      language: 'en',
      profile: { blind: true, audio_announce: true, guide_dog: true, preferred_seat: 'priority' },
      emergency: 'Rajesh Sharma: +91 9800000099'
    },
    {
      id: 'usr_rohan',
      phone: '9800000002',
      name: 'Rohan Sen',
      role: 'passenger',
      language: 'en',
      profile: { wheelchair: true, ramp_needed: true, motorized_chair: true },
      emergency: 'Anjali Sen: +91 9800000088'
    },
    {
      id: 'usr_meera',
      phone: '9800000003',
      name: 'Meera Ghosh',
      role: 'passenger',
      language: 'bn',
      profile: { deaf: true, visual_alerts: true, text_first: true },
      emergency: 'Sunil Ghosh: +91 9800000077'
    },
    {
      id: 'usr_dev',
      phone: '9800000004',
      name: 'Dev Mukherjee',
      role: 'passenger',
      language: 'hi',
      profile: { cognitive: true, simple_mode: true, assistance_needed: true },
      emergency: 'Kavita Mukherjee: +91 9800000066'
    },
    {
      id: 'usr_depot',
      phone: '9800000000',
      name: 'Central Depot Dispatcher',
      role: 'depot',
      language: 'en',
      profile: {},
      emergency: ''
    }
  ];

  const insertUser = db.prepare('INSERT INTO users (id, phone, name, role, language, profile, emergency_contact_enc, consent_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const now = Date.now();
  for (const u of demoUsers) {
    insertUser.run(
      u.id,
      u.phone,
      u.name,
      u.role,
      u.language,
      JSON.stringify(u.profile),
      encryptText(u.emergency),
      now,
      now
    );
  }

  logger.info('Database seeded successfully with 12 stops, 6 routes, 14 buses, trips, conductors, and demo personas.');
}

// Auto-run if executed directly
if (process.argv[1]?.includes('seed')) {
  seedDatabase();
}
