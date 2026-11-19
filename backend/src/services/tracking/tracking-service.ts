import { getDb } from '../../db/index.js';
import { alertsEventEmitter } from '../alerts/alerts-service.js';
import { searchNearestTrips } from '../search/nearest-time.js';
import { logger } from '../../lib/logger.js';

export interface BusTrackingState {
  tripId: string;
  routeId: string;
  busRegNo: string;
  currentStopId: string;
  currentStopName: string;
  nextStopId: string;
  nextStopName: string;
  progressPercent: number;
  etaMinutes: number;
  status: string;
  delayMin: number;
}

/**
 * Get live simulation tracking state for a trip
 */
export function getTripTrackingState(tripId: string): BusTrackingState | null {
  const db = getDb();
  const trip = db.prepare(`
    SELECT t.id, t.route_id, t.status, t.delay_min, b.reg_no
    FROM trips t
    JOIN buses b ON t.bus_id = b.id
    WHERE t.id = ?
  `).get(tripId) as any;

  if (!trip) return null;

  const routeStops = db.prepare(`
    SELECT rs.stop_id, rs.seq, rs.offset_min, s.name
    FROM route_stops rs
    JOIN stops s ON rs.stop_id = s.id
    WHERE rs.route_id = ?
    ORDER BY rs.seq ASC
  `).all(trip.route_id) as any[];

  if (routeStops.length === 0) return null;

  // Compute simulated progress based on current time or fixed demo progression
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const totalTripTime = routeStops[routeStops.length - 1].offset_min;
  const progressPercent = Math.min(95, Math.max(10, ((currentMinutes % 45) / 45) * 100));

  const currentStopIndex = Math.min(
    routeStops.length - 2,
    Math.floor((progressPercent / 100) * (routeStops.length - 1))
  );

  const currentStop = routeStops[currentStopIndex] || routeStops[0];
  const nextStop = routeStops[currentStopIndex + 1] || routeStops[routeStops.length - 1];
  const etaMinutes = Math.max(1, Math.round(((100 - progressPercent) / 100) * totalTripTime) + (trip.delay_min || 0));

  return {
    tripId: trip.id,
    routeId: trip.route_id,
    busRegNo: trip.reg_no,
    currentStopId: currentStop.stop_id,
    currentStopName: currentStop.name,
    nextStopId: nextStop.stop_id,
    nextStopName: nextStop.name,
    progressPercent: Math.round(progressPercent),
    etaMinutes,
    status: trip.status,
    delayMin: trip.delay_min || 0
  };
}

/**
 * Simulate delay for a trip and notify affected passengers with nearest alternative
 */
export function triggerTripDelay(tripId: string, minutes: number): { success: boolean; affectedBookings: number } {
  const db = getDb();
  db.prepare('UPDATE trips SET delay_min = delay_min + ? WHERE id = ?').run(minutes, tripId);

  const bookings = db.prepare(`
    SELECT b.id, b.user_id, b.from_stop, b.to_stop, b.needs, t.service_date, t.scheduled_departs
    FROM bookings b
    JOIN trips t ON b.trip_id = t.id
    WHERE b.trip_id = ? AND b.status = 'confirmed'
  `).all(tripId) as any[];

  for (const bkg of bookings) {
    const alternatives = searchNearestTrips({
      from: bkg.from_stop,
      to: bkg.to_stop,
      date: bkg.service_date,
      time: bkg.scheduled_departs,
      needs: JSON.parse(bkg.needs || '[]')
    });

    const bestAlt = alternatives.after || alternatives.before;

    db.prepare('INSERT INTO booking_events (id, booking_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)').run(
      `evt_${Date.now()}_delay_${bkg.id}`,
      bkg.id,
      'delayed',
      JSON.stringify({ delayMin: minutes, suggestedAlternative: bestAlt }),
      Date.now()
    );

    alertsEventEmitter.emit(`booking_${bkg.id}`, {
      type: 'delay_alert',
      message: `Your bus is delayed by ${minutes} minutes.`,
      alternative: bestAlt
    });
  }

  logger.info({ tripId, minutes, affectedCount: bookings.length }, 'Trip delay injected and passengers notified');
  return { success: true, affectedBookings: bookings.length };
}

/**
 * Simulate trip cancellation and suggest alternatives
 */
export function triggerTripCancel(tripId: string): { success: boolean; affectedBookings: number } {
  const db = getDb();
  db.prepare("UPDATE trips SET status = 'cancelled' WHERE id = ?").run(tripId);

  const bookings = db.prepare(`
    SELECT b.id, b.user_id, b.from_stop, b.to_stop, b.needs, t.service_date, t.scheduled_departs
    FROM bookings b
    JOIN trips t ON b.trip_id = t.id
    WHERE b.trip_id = ? AND b.status = 'confirmed'
  `).all(tripId) as any[];

  for (const bkg of bookings) {
    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(bkg.id);

    const alternatives = searchNearestTrips({
      from: bkg.from_stop,
      to: bkg.to_stop,
      date: bkg.service_date,
      time: bkg.scheduled_departs,
      needs: JSON.parse(bkg.needs || '[]')
    });

    const bestAlt = alternatives.after || alternatives.before;

    db.prepare('INSERT INTO booking_events (id, booking_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)').run(
      `evt_${Date.now()}_cancel_${bkg.id}`,
      bkg.id,
      'cancelled',
      JSON.stringify({ reason: 'Trip cancelled by depot', suggestedAlternative: bestAlt }),
      Date.now()
    );

    alertsEventEmitter.emit(`booking_${bkg.id}`, {
      type: 'trip_cancelled',
      message: 'Your bus trip has been cancelled. Nearest rebooking options are ready.',
      alternative: bestAlt
    });
  }

  return { success: true, affectedBookings: bookings.length };
}
