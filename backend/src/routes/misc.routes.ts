import { FastifyPluginAsync } from 'fastify';
import { getDb } from '../db/index.js';
import { seedDatabase } from '../db/seed.js';
import { handleSosEvent, verifyConcessionCard } from '../services/sos/sos-service.js';
import { triggerTripDelay, triggerTripCancel } from '../services/tracking/tracking-service.js';
import { decryptText } from '../lib/crypto.js';

export const miscRoutes: FastifyPluginAsync = async (server) => {
  // Health check
  server.get('/api/health', async () => {
    return {
      status: 'healthy',
      service: 'SaathiBus Backend',
      version: '1.0.0',
      time: new Date().toISOString(),
      network: 'SaathiBus Accessible Transit Network'
    };
  });

  // Concession verification
  server.post('/api/concession/verify', async (request, reply) => {
    const { idNumber } = request.body as { idNumber?: string };
    const result = verifyConcessionCard(idNumber || '');
    return reply.send(result);
  });

  // Emergency SOS
  server.post('/api/sos', async (request, reply) => {
    const { bookingId, lat, lng } = request.body as { bookingId?: string; lat?: number; lng?: number };
    const userId = (request.headers['x-user-id'] as string) || undefined;
    const result = handleSosEvent(userId, bookingId, lat, lng);
    return reply.send(result);
  });

  // Depot overview
  server.get('/api/depot/overview', async () => {
    const db = getDb();
    const buses = db.prepare('SELECT id, reg_no, route_id, features FROM buses').all();
    const activeTrips = db.prepare("SELECT * FROM trips WHERE status = 'scheduled' LIMIT 20").all();
    const unacknowledgedAlerts = db.prepare(`
      SELECT a.*, b.from_stop, b.to_stop, u.name as passenger_name
      FROM alerts a
      JOIN bookings b ON a.booking_id = b.id
      JOIN users u ON b.user_id = u.id
      WHERE a.status IN ('sent', 'escalated')
      ORDER BY a.created_at DESC
    `).all();

    return {
      totalBuses: buses.length,
      activeTripsCount: activeTrips.length,
      pendingAlertsCount: unacknowledgedAlerts.length,
      escalatedAlerts: unacknowledgedAlerts.filter((a: any) => a.status === 'escalated'),
      alerts: unacknowledgedAlerts
    };
  });

  // Demo delay trigger
  server.post('/api/demo/delay', async (request, reply) => {
    const { tripId, minutes } = request.body as { tripId: string; minutes?: number };
    if (!tripId) return reply.status(400).send({ error: { code: 'MISSING_FIELD', message: 'tripId is required' } });
    const result = triggerTripDelay(tripId, minutes || 15);
    return reply.send(result);
  });

  // Demo cancel trigger
  server.post('/api/demo/cancel', async (request, reply) => {
    const { tripId } = request.body as { tripId: string };
    if (!tripId) return reply.status(400).send({ error: { code: 'MISSING_FIELD', message: 'tripId is required' } });
    const result = triggerTripCancel(tripId);
    return reply.send(result);
  });

  // Demo reset trigger
  server.post('/api/demo/reset', async () => {
    seedDatabase();
    return { success: true, message: 'Transit database reset to initial seeded state.' };
  });

  // Privacy: Export user data
  server.get('/api/me/export', async (request, reply) => {
    const userId = (request.headers['x-user-id'] as string) || 'usr_asha';
    const db = getDb();
    const user = db.prepare('SELECT id, phone, name, role, language, profile, emergency_contact_enc, consent_at FROM users WHERE id = ?').get(userId) as any;

    if (!user) return reply.status(404).send({ error: { code: 'USER_NOT_FOUND', message: 'User not found' } });

    const bookings = db.prepare('SELECT id, code, trip_id, from_stop, to_stop, needs, status, created_at FROM bookings WHERE user_id = ?').all(userId) as any[];

    return reply.send({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        language: user.language,
        profile: JSON.parse(user.profile || '{}'),
        emergencyContact: user.emergency_contact_enc ? decryptText(user.emergency_contact_enc) : null,
        consentAt: user.consent_at
      },
      bookings: bookings.map(b => ({ ...b, needs: JSON.parse(b.needs || '[]') }))
    });
  });

  // Privacy: Erase user data
  server.delete('/api/me', async (request, reply) => {
    const userId = (request.headers['x-user-id'] as string) || 'usr_asha';
    const db = getDb();
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    db.prepare("UPDATE bookings SET user_id = 'anonymized', note_enc = NULL WHERE user_id = ?").run(userId);
    return reply.send({ success: true, message: 'All personal data erased in compliance with privacy guidelines.' });
  });
};
