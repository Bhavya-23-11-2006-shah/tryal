import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { searchNearestTrips } from '../services/search/nearest-time.js';
import { getDb } from '../db/index.js';

const searchQuerySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  date: z.string().min(8),
  time: z.string().min(3),
  needs: z.string().optional(),
  language: z.enum(['en', 'hi', 'bn']).optional()
});

export const tripsRoutes: FastifyPluginAsync = async (server) => {
  server.get('/api/search', async (request, reply) => {
    const parsed = searchQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_QUERY', message: 'from, to, date, and time are required query parameters' }
      });
    }

    const needsArray = parsed.data.needs ? parsed.data.needs.split(',').map(s => s.trim()) : [];
    const results = searchNearestTrips({
      from: parsed.data.from,
      to: parsed.data.to,
      date: parsed.data.date,
      time: parsed.data.time,
      needs: needsArray,
      language: parsed.data.language
    });

    return reply.send(results);
  });

  server.get('/api/trips/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const db = getDb();

    const trip = db.prepare(`
      SELECT t.id, t.route_id, t.bus_id, t.service_date, t.scheduled_departs, t.status, t.delay_min, t.crowd_level,
             r.number as route_number, r.name as route_name, b.reg_no, b.features
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN buses b ON t.bus_id = b.id
      WHERE t.id = ?
    `).get(id) as any;

    if (!trip) {
      return reply.status(404).send({
        error: { code: 'TRIP_NOT_FOUND', message: 'Trip does not exist' }
      });
    }

    const seats = db.prepare(`
      SELECT s.id, s.label, s.kind, ts.state
      FROM seats s
      JOIN trip_seats ts ON s.id = ts.seat_id AND ts.trip_id = ?
      WHERE s.bus_id = ?
      ORDER BY s.kind DESC, s.label ASC
    `).all(id, trip.bus_id) as any[];

    return reply.send({
      ...trip,
      features: JSON.parse(trip.features || '{}'),
      seats
    });
  });
};
