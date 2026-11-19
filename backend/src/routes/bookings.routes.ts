import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createBooking, cancelBooking, rescheduleBooking } from '../services/booking/booking-engine.js';
import { getDb } from '../db/index.js';
import { alertsEventEmitter } from '../services/alerts/alerts-service.js';
import { getTripTrackingState } from '../services/tracking/tracking-service.js';

const createBookingSchema = z.object({
  tripId: z.string().min(1),
  seatId: z.string().optional(),
  passengerName: z.string().optional(),
  fromStop: z.string().default('Esplanade'),
  toStop: z.string().default('Salt Lake Sector V'),
  needs: z.array(z.string()).optional(),
  companion: z.boolean().optional(),
  guideDog: z.boolean().optional(),
  note: z.string().optional(),
  bookedFor: z.string().optional(),
  idempotencyKey: z.string().optional(),
  confirm: z.boolean().optional()
});

export const bookingsRoutes: FastifyPluginAsync = async (server) => {
  server.post('/api/bookings', async (request, reply) => {
    const parsed = createBookingSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Valid tripId is required' }
      });
    }

    const userId = (request.headers['x-user-id'] as string) || 'usr_asha';
    const result = createBooking({
      ...parsed.data,
      userId
    });

    return reply.status(201).send(result);
  });

  server.get('/api/bookings', async (request, reply) => {
    const userId = (request.headers['x-user-id'] as string) || 'usr_asha';
    const db = getDb();

    const bookings = db.prepare(`
      SELECT b.*, t.service_date, t.scheduled_departs, t.status as trip_status, r.number as route_number, r.name as route_name
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      JOIN routes r ON t.route_id = r.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(userId) as any[];

    return reply.send(bookings.map(b => ({
      ...b,
      needs: JSON.parse(b.needs || '[]'),
      companion: Boolean(b.companion),
      guideDog: Boolean(b.guide_dog)
    })));
  });

  server.get('/api/bookings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const booking = db.prepare(`
      SELECT b.*, t.service_date, t.scheduled_departs, t.delay_min, t.status as trip_status,
             r.number as route_number, r.name as route_name, bus.reg_no
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      JOIN routes r ON t.route_id = r.id
      JOIN buses bus ON t.bus_id = bus.id
      WHERE b.id = ? OR b.code = ?
    `).get(id, id) as any;

    if (!booking) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }

    const events = db.prepare('SELECT type, payload, created_at FROM booking_events WHERE booking_id = ? ORDER BY created_at ASC').all(booking.id) as any[];
    const tracking = getTripTrackingState(booking.trip_id);

    return reply.send({
      ...booking,
      needs: JSON.parse(booking.needs || '[]'),
      companion: Boolean(booking.companion),
      guideDog: Boolean(booking.guide_dog),
      events: events.map(e => ({ type: e.type, payload: JSON.parse(e.payload || '{}'), createdAt: e.created_at })),
      tracking
    });
  });

  server.patch('/api/bookings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { newTripId, newSeatId } = request.body as { newTripId: string; newSeatId?: string };

    if (!newTripId) {
      return reply.status(400).send({ error: { code: 'MISSING_FIELD', message: 'newTripId is required to reschedule' } });
    }

    const updated = rescheduleBooking(id, newTripId, newSeatId);
    return reply.send(updated);
  });

  server.delete('/api/bookings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = cancelBooking(id);
    return reply.send(result);
  });

  // Server-Sent Events (SSE) stream for real-time booking status & conductor updates
  server.get('/api/stream/bookings/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();
    const booking = db.prepare('SELECT id, trip_id FROM bookings WHERE id = ? OR code = ?').get(id, id) as any;

    if (!booking) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders();

    // Initial event with current tracking state
    const tracking = getTripTrackingState(booking.trip_id);
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', bookingId: booking.id, tracking })}\n\n`);

    // Listener for live events on this booking
    const eventHandler = (payload: any) => {
      reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    alertsEventEmitter.on(`booking_${booking.id}`, eventHandler);

    // Heartbeat every 15s to keep connection alive on free hosts / proxies
    const heartbeat = setInterval(() => {
      reply.raw.write(': heartbeat\n\n');
    }, 15000);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      alertsEventEmitter.off(`booking_${booking.id}`, eventHandler);
    });
  });
};
