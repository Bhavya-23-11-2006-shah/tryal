import { getDb } from '../../db/index.js';
import { AppError } from '../../lib/errors.js';

export interface SearchParams {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  needs?: string[]; // wheelchair, visual, hearing, cognitive, ramp
  language?: string; // en, hi, bn
}

export interface TripSearchResult {
  id: string;
  routeId: string;
  routeNumber: string;
  routeName: string;
  busId: string;
  busRegNo: string;
  serviceDate: string;
  departs: string; // HH:mm effective at boarding stop
  arrives: string; // HH:mm effective at destination stop
  durationMin: number;
  status: string;
  delayMin: number;
  crowdLevel: string;
  features: {
    low_floor: boolean;
    ramp: boolean;
    wheelchair_bays: number;
    priority_seats: number;
    audio_announce: boolean;
    visual_display: boolean;
    tactile_signs: boolean;
    guide_dog_space: boolean;
  };
  bays: { total: number; free: number };
  prioritySeats: { total: number; free: number };
  fare: number;
  concessionFare: number;
  minutesDifference?: number;
}

export interface SearchResponse {
  exact: TripSearchResult[];
  before: TripSearchResult | null;
  after: TripSearchResult | null;
  requested: { date: string; time: string; from: string; to: string };
  message: string;
  messages_by_lang: { en: string; hi: string; bn: string };
  waitlistOffered?: boolean;
}

/**
 * Fuzzy stop resolver supporting ID, English, Hindi, and Bengali stop names
 */
export function resolveStop(input: string): { id: string; name: string; name_hi: string; name_bn: string } | null {
  if (!input) return null;
  const db = getDb();
  const trimmed = input.trim().toLowerCase();

  // Try exact ID match
  const byId = db.prepare('SELECT id, name, name_hi, name_bn FROM stops WHERE LOWER(id) = ?').get(trimmed) as any;
  if (byId) return byId;

  // Try exact or partial name in EN, HI, BN
  const allStops = db.prepare('SELECT id, name, name_hi, name_bn FROM stops').all() as any[];
  for (const s of allStops) {
    if (
      s.name.toLowerCase() === trimmed ||
      s.name_hi.toLowerCase() === trimmed ||
      s.name_bn.toLowerCase() === trimmed ||
      s.name.toLowerCase().includes(trimmed) ||
      trimmed.includes(s.name.toLowerCase())
    ) {
      return s;
    }
  }

  return null;
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMin: number): string {
  const normalized = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Core nearest-time search implementation
 */
export function searchNearestTrips(params: SearchParams): SearchResponse {
  const fromStop = resolveStop(params.from);
  const toStop = resolveStop(params.to);

  if (!fromStop) {
    throw new AppError(`Starting stop '${params.from}' not recognized.`, 404, 'STOP_NOT_FOUND', 'Check the list of available stops.');
  }
  if (!toStop) {
    throw new AppError(`Destination stop '${params.to}' not recognized.`, 404, 'STOP_NOT_FOUND', 'Check the list of available stops.');
  }
  if (fromStop.id === toStop.id) {
    throw new AppError('Boarding stop and destination stop cannot be the same.', 400, 'SAME_STOP');
  }

  const requestedMinutes = timeToMinutes(params.time);
  const needs = params.needs || [];
  const db = getDb();

  // Find routes that serve fromStop BEFORE toStop
  const candidateRoutesSql = `
    SELECT r.id, r.number, r.name,
           rs1.seq as from_seq, rs1.offset_min as from_offset,
           rs2.seq as to_seq, rs2.offset_min as to_offset
    FROM routes r
    JOIN route_stops rs1 ON r.id = rs1.route_id AND rs1.stop_id = ?
    JOIN route_stops rs2 ON r.id = rs2.route_id AND rs2.stop_id = ?
    WHERE rs1.seq < rs2.seq
  `;
  const candidateRoutes = db.prepare(candidateRoutesSql).all(fromStop.id, toStop.id) as any[];

  if (candidateRoutes.length === 0) {
    throw new AppError(
      `No direct bus route found between ${fromStop.name} and ${toStop.name}.`,
      404,
      'NO_ROUTE',
      'Try searching with major transfer hubs like Esplanade.'
    );
  }

  const routeMap = new Map<string, any>(candidateRoutes.map(r => [r.id, r]));
  const routeIds = candidateRoutes.map(r => `'${r.id}'`).join(',');

  // Query trips for these routes on this service date
  const tripsSql = `
    SELECT t.id, t.route_id, t.bus_id, t.service_date, t.scheduled_departs, t.status, t.delay_min, t.crowd_level,
           b.reg_no, b.features
    FROM trips t
    JOIN buses b ON t.bus_id = b.id
    WHERE t.route_id IN (${routeIds})
      AND t.service_date = ?
      AND t.status != 'cancelled'
    ORDER BY t.scheduled_departs ASC
  `;
  const rawTrips = db.prepare(tripsSql).all(params.date) as any[];

  // Filter candidates by accessibility needs and calculate effective times
  const validTrips: TripSearchResult[] = [];

  for (const t of rawTrips) {
    const routeInfo = routeMap.get(t.route_id);
    const features = JSON.parse(t.features);

    // Accessibility filter checks
    if (needs.includes('wheelchair') && (!features.ramp || features.wheelchair_bays === 0)) continue;
    if (needs.includes('ramp') && !features.ramp) continue;
    if (needs.includes('visual') && !features.audio_announce) continue;
    if (needs.includes('hearing') && !features.visual_display) continue;

    // Check bay & priority seat availability
    const seatStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN s.kind = 'wheelchair_bay' THEN 1 ELSE 0 END) as total_bays,
        SUM(CASE WHEN s.kind = 'wheelchair_bay' AND ts.state = 'free' THEN 1 ELSE 0 END) as free_bays,
        SUM(CASE WHEN s.kind = 'priority_seat' THEN 1 ELSE 0 END) as total_pri,
        SUM(CASE WHEN s.kind = 'priority_seat' AND ts.state = 'free' THEN 1 ELSE 0 END) as free_pri
      FROM trip_seats ts
      JOIN seats s ON ts.seat_id = s.id
      WHERE ts.trip_id = ?
    `).get(t.id) as any;

    const totalBays = Number(seatStats?.total_bays || 0);
    const freeBays = Number(seatStats?.free_bays || 0);
    const totalPri = Number(seatStats?.total_pri || 0);
    const freePri = Number(seatStats?.free_pri || 0);

    // If wheelchair requested, must have at least 1 free bay
    if (needs.includes('wheelchair') && freeBays === 0) continue;

    // Calculate effective boarding departure and destination arrival
    const schedMin = timeToMinutes(t.scheduled_departs);
    const effectiveDepMin = schedMin + routeInfo.from_offset + (t.delay_min || 0);
    const effectiveArrMin = schedMin + routeInfo.to_offset + (t.delay_min || 0);
    const durationMin = effectiveArrMin - effectiveDepMin;

    validTrips.push({
      id: t.id,
      routeId: t.route_id,
      routeNumber: routeInfo.number,
      routeName: routeInfo.name,
      busId: t.bus_id,
      busRegNo: t.reg_no,
      serviceDate: t.service_date,
      departs: minutesToTime(effectiveDepMin),
      arrives: minutesToTime(effectiveArrMin),
      durationMin: Math.max(5, durationMin),
      status: t.status,
      delayMin: t.delay_min || 0,
      crowdLevel: t.crowd_level,
      features,
      bays: { total: totalBays, free: freeBays },
      prioritySeats: { total: totalPri, free: freePri },
      fare: 25,
      concessionFare: 0 // Free or deeply subsidized concession fare for persons with disabilities
    });
  }

  // Sort valid trips by departure time
  validTrips.sort((a, b) => timeToMinutes(a.departs) - timeToMinutes(b.departs));

  // Determine exact (+/- 5 min), nearest-before, and nearest-after
  const exactTrips = validTrips.filter(t => {
    const diff = Math.abs(timeToMinutes(t.departs) - requestedMinutes);
    return diff <= 5;
  });

  if (exactTrips.length > 0) {
    exactTrips.sort((a, b) => Math.abs(timeToMinutes(a.departs) - requestedMinutes) - Math.abs(timeToMinutes(b.departs) - requestedMinutes));
    const msgEn = `Bus available at ${exactTrips[0].departs} from ${fromStop.name} to ${toStop.name}.`;
    const msgHi = `${fromStop.name_hi} से ${toStop.name_hi} के लिए ${exactTrips[0].departs} पर बस उपलब्ध है।`;
    const msgBn = `${fromStop.name_bn} থেকে ${toStop.name_bn} এর জন্য ${exactTrips[0].departs} এ বাস উপলব্ধ রয়েছে।`;

    return {
      exact: exactTrips,
      before: null,
      after: null,
      requested: { date: params.date, time: params.time, from: fromStop.name, to: toStop.name },
      message: msgEn,
      messages_by_lang: { en: msgEn, hi: msgHi, bn: msgBn }
    };
  }

  // No exact bus: find closest before and closest after
  let beforeTrip: TripSearchResult | null = null;
  let afterTrip: TripSearchResult | null = null;

  for (const t of validTrips) {
    const tripMin = timeToMinutes(t.departs);
    if (tripMin < requestedMinutes) {
      beforeTrip = t; // Since sorted ascending, last one seen before T is latest before
    } else if (tripMin > requestedMinutes && !afterTrip) {
      afterTrip = t; // First one seen after T is earliest after
    }
  }

  if (beforeTrip) {
    beforeTrip.minutesDifference = requestedMinutes - timeToMinutes(beforeTrip.departs);
  }
  if (afterTrip) {
    afterTrip.minutesDifference = timeToMinutes(afterTrip.departs) - requestedMinutes;
  }

  // Build human-friendly multilingual explanation
  let msgEn = `No bus at ${params.time}. `;
  let msgHi = `${params.time} पर कोई बस नहीं है। `;
  let msgBn = `${params.time} এ কোনো বাস নেই। `;

  if (beforeTrip && afterTrip) {
    msgEn += `Closest before is ${beforeTrip.departs} (${beforeTrip.minutesDifference} minutes earlier), closest after is ${afterTrip.departs} (${afterTrip.minutesDifference} minutes later).`;
    msgHi += `निकटतम पहले ${beforeTrip.departs} (${beforeTrip.minutesDifference} मिनट पहले) और बाद में ${afterTrip.departs} (${afterTrip.minutesDifference} मिनट बाद) है।`;
    msgBn += `নিকটতম আগে ${beforeTrip.departs} (${beforeTrip.minutesDifference} মিনিট আগে), নিকটতম পরে ${afterTrip.departs} (${afterTrip.minutesDifference} মিনিট পরে)।`;
  } else if (afterTrip) {
    msgEn += `This is earlier than the first bus. Closest after is ${afterTrip.departs} (${afterTrip.minutesDifference} minutes later).`;
    msgHi += `यह पहली बस से पहले का समय है। निकटतम बाद की बस ${afterTrip.departs} पर है।`;
    msgBn += `এটি দিনের প্রথম বাসের আগের সময়। নিকটতম পরের বাস ${afterTrip.departs} এ।`;
  } else if (beforeTrip) {
    msgEn += `Last bus for today was at ${beforeTrip.departs}. We suggest booking the first bus tomorrow at 7:15 AM.`;
    msgHi += `आज की अंतिम बस ${beforeTrip.departs} पर थी। हम कल सुबह 7:15 की पहली बस की सलाह देते हैं।`;
    msgBn += `আজকের শেষ বাস ছিল ${beforeTrip.departs} এ। আমরা আগামীকাল সকাল ৭:১৫ এর প্রথম বাস বুক করার পরামর্শ দিচ্ছি।`;
  } else {
    msgEn += 'No accessible buses found for this date. Would you like to check tomorrow?';
    msgHi += 'इस तारीख के लिए कोई सुलभ बस नहीं मिली। क्या आप कल के विकल्प देखना चाहेंगे?';
    msgBn += 'এই তারিখের জন্য কোনো সুবিধাজনক বাস পাওয়া যায়নি। আপনি কি আগামীকালের বিকল্প দেখতে চান?';
  }

  return {
    exact: [],
    before: beforeTrip,
    after: afterTrip,
    requested: { date: params.date, time: params.time, from: fromStop.name, to: toStop.name },
    message: msgEn,
    messages_by_lang: { en: msgEn, hi: msgHi, bn: msgBn },
    waitlistOffered: !beforeTrip && !afterTrip
  };
}
