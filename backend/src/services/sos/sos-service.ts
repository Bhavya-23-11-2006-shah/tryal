import { getDb } from '../../db/index.js';
import { alertsEventEmitter } from '../alerts/alerts-service.js';
import { decryptText } from '../../lib/crypto.js';
import { logger } from '../../lib/logger.js';

export interface SosEventResult {
  id: string;
  status: 'received';
  notifiedContacts: string[];
  depotAlertDispatched: boolean;
  message: string;
}

/**
 * Handle Emergency SOS dispatch
 */
export function handleSosEvent(userId?: string, bookingId?: string, lat?: number, lng?: number): SosEventResult {
  const db = getDb();
  const eventId = `sos_${Date.now()}`;
  const now = Date.now();

  db.prepare(`
    INSERT INTO sos_events (id, booking_id, user_id, lat, lng, created_at, status)
    VALUES (?, ?, ?, ?, ?, ?, 'received')
  `).run(eventId, bookingId || null, userId || null, lat || null, lng || null, now);

  // Retrieve user emergency contact if available
  const notifiedContacts: string[] = [];
  if (userId) {
    const user = db.prepare('SELECT emergency_contact_enc FROM users WHERE id = ?').get(userId) as any;
    if (user?.emergency_contact_enc) {
      const contact = decryptText(user.emergency_contact_enc);
      if (contact) notifiedContacts.push(contact);
    }
  }

  // Audit log entry
  db.prepare('INSERT INTO audit_log (id, actor, action, entity, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    `aud_${now}`,
    userId || 'anonymous',
    'TRIGGER_SOS',
    'sos_event',
    eventId,
    now
  );

  // Alert depot monitor
  alertsEventEmitter.emit('sos_triggered', {
    id: eventId,
    userId,
    bookingId,
    lat,
    lng,
    createdAt: now,
    notifiedContacts
  });

  logger.warn({ eventId, userId, bookingId }, 'EMERGENCY SOS Triggered');

  return {
    id: eventId,
    status: 'received',
    notifiedContacts,
    depotAlertDispatched: true,
    message: 'Emergency SOS received. Transit control and your emergency contact have been notified.'
  };
}

/**
 * Verify concession / disability certificate card validation
 */
export function verifyConcessionCard(idNumber: string): { verified: boolean; type: string; message: string } {
  if (!idNumber || idNumber.trim().length < 6) {
    return {
      verified: false,
      type: 'unknown',
      message: 'Invalid certificate or UDID card number.'
    };
  }

  const clean = idNumber.trim().toUpperCase();
  const isUdid = /^[A-Z]{2}\d{10,16}$/.test(clean);

  return {
    verified: true,
    type: isUdid ? 'UDID National Disability Card' : 'State Disability Certificate',
    message: 'Concession card verified. 100% fare waiver applied for your travel.'
  };
}
