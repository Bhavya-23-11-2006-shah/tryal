import { EventEmitter } from 'node:events';
import { getDb } from '../../db/index.js';
import { AppError } from '../../lib/errors.js';
import { logger } from '../../lib/logger.js';

export const alertsEventEmitter = new EventEmitter();
alertsEventEmitter.setMaxListeners(100);

export interface ConductorAlert {
  id: string;
  bookingId: string;
  tripId: string;
  conductorId?: string;
  severity: string;
  summary: string;
  status: 'sent' | 'acknowledged' | 'escalated' | 'resolved';
  createdAt: number;
  ackAt?: number;
  escalatedAt?: number;
}

/**
 * Generate conductor alert upon passenger booking
 */
export function triggerConductorAlert(
  bookingId: string,
  tripId: string,
  fromStop: string,
  passengerName: string,
  needs: string[],
  guideDog?: boolean
): ConductorAlert {
  const db = getDb();

  // Find assigned conductor for this trip's bus
  const trip = db.prepare('SELECT bus_id FROM trips WHERE id = ?').get(tripId) as any;
  const conductor = trip
    ? (db.prepare('SELECT id, name FROM conductors WHERE bus_id = ?').get(trip.bus_id) as any)
    : null;

  const needsList = [...needs];
  if (guideDog) needsList.push('guide dog');
  const needsStr = needsList.length > 0 ? needsList.join(', ') : 'standard assistance';
  const summary = `Stop: ${fromStop} | Passenger: ${passengerName} | Needs: ${needsStr}`;

  const alertId = `alt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const now = Date.now();

  db.prepare(`
    INSERT INTO alerts (id, booking_id, trip_id, conductor_id, severity, summary, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'sent', ?)
  `).run(alertId, bookingId, tripId, conductor?.id || null, 'high', summary, now);

  // Add booking event 'conductor_notified'
  db.prepare('INSERT INTO booking_events (id, booking_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)').run(
    `evt_${Date.now()}_notified`,
    bookingId,
    'conductor_notified',
    JSON.stringify({ alertId, summary }),
    now
  );

  const alert: ConductorAlert = {
    id: alertId,
    bookingId,
    tripId,
    conductorId: conductor?.id,
    severity: 'high',
    summary,
    status: 'sent',
    createdAt: now
  };

  // Broadcast to live SSE subscribers
  alertsEventEmitter.emit('new_alert', alert);
  alertsEventEmitter.emit(`booking_${bookingId}`, { type: 'conductor_notified', alert });

  logger.info({ alertId, tripId, summary }, 'Conductor alert dispatched');
  return alert;
}

/**
 * Conductor acknowledges the assistance request
 */
export function acknowledgeAlert(alertId: string, conductorId?: string): { success: boolean; alert: ConductorAlert } {
  const db = getDb();
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId) as any;
  if (!alert) throw new AppError('Alert not found.', 404, 'ALERT_NOT_FOUND');

  const now = Date.now();
  db.prepare("UPDATE alerts SET status = 'acknowledged', ack_at = ? WHERE id = ?").run(now, alertId);

  // Record 'conductor_ack' event on passenger booking timeline
  db.prepare('INSERT INTO booking_events (id, booking_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)').run(
    `evt_${Date.now()}_ack`,
    alert.booking_id,
    'conductor_ack',
    JSON.stringify({ ackAt: now, conductorId }),
    now
  );

  const updatedAlert: ConductorAlert = {
    id: alert.id,
    bookingId: alert.booking_id,
    tripId: alert.trip_id,
    conductorId: alert.conductor_id,
    severity: alert.severity,
    summary: alert.summary,
    status: 'acknowledged',
    createdAt: alert.created_at,
    ackAt: now
  };

  alertsEventEmitter.emit('alert_updated', updatedAlert);
  alertsEventEmitter.emit(`booking_${alert.booking_id}`, { type: 'conductor_ack', alert: updatedAlert });

  return { success: true, alert: updatedAlert };
}

/**
 * Record boarding outcome (boarded or no-show)
 */
export function recordConductorOutcome(alertId: string, outcome: 'boarded' | 'no_show'): { success: boolean } {
  const db = getDb();
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId) as any;
  if (!alert) throw new AppError('Alert not found.', 404, 'ALERT_NOT_FOUND');

  const now = Date.now();
  db.prepare("UPDATE alerts SET status = 'resolved' WHERE id = ?").run(alertId);

  const eventType = outcome === 'boarded' ? 'boarding_ready' : 'no_show';
  db.prepare('INSERT INTO booking_events (id, booking_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)').run(
    `evt_${now}_${outcome}`,
    alert.booking_id,
    eventType,
    JSON.stringify({ outcome, resolvedAt: now }),
    now
  );

  if (outcome === 'no_show') {
    db.prepare("UPDATE bookings SET status = 'no_show' WHERE id = ?").run(alert.booking_id);
    db.prepare("UPDATE trip_seats SET state = 'free', booking_id = NULL WHERE booking_id = ?").run(alert.booking_id);
  }

  alertsEventEmitter.emit(`booking_${alert.booking_id}`, { type: eventType, outcome });
  return { success: true };
}

/**
 * Escalation checker: escalates unacknowledged alerts to depot
 */
export function checkEscalations(): void {
  const db = getDb();
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const unacked = db.prepare(`
    SELECT * FROM alerts 
    WHERE status = 'sent' AND created_at < ?
  `).all(tenMinutesAgo) as any[];

  for (const alt of unacked) {
    db.prepare("UPDATE alerts SET status = 'escalated', escalated_at = ? WHERE id = ?").run(Date.now(), alt.id);
    alertsEventEmitter.emit('alert_escalated', { ...alt, status: 'escalated' });
    logger.warn({ alertId: alt.id }, 'Alert unacknowledged, escalated to depot');
  }
}
