import { FastifyPluginAsync } from 'fastify';
import crypto from 'node:crypto';
import { getDb } from '../db/index.js';
import { acknowledgeAlert, recordConductorOutcome, alertsEventEmitter } from '../services/alerts/alerts-service.js';

export const conductorRoutes: FastifyPluginAsync = async (server) => {
  // Conductor login by bus number and shift code (demo code 1234)
  server.post('/api/conductor/login', async (request, reply) => {
    const { busNo, shiftCode } = request.body as { busNo?: string; shiftCode?: string };

    if (!shiftCode) {
      return reply.status(400).send({ error: { code: 'MISSING_CREDENTIALS', message: 'Shift code required' } });
    }

    const hash = crypto.createHash('sha256').update(shiftCode).digest('hex');
    const db = getDb();
    const conductor = db.prepare('SELECT id, name, bus_id FROM conductors WHERE shift_code_hash = ?').get(hash) as any;

    if (!conductor) {
      return reply.status(401).send({ error: { code: 'INVALID_SHIFT_CODE', message: 'Invalid shift code. Demo code is 1234.' } });
    }

    return reply.send({
      success: true,
      conductor: {
        id: conductor.id,
        name: conductor.name,
        busId: conductor.bus_id,
        busNo: busNo || 'WB-01-A-1001'
      }
    });
  });

  // Get active conductor alerts + live stream
  server.get('/api/conductor/alerts', async (request, reply) => {
    const isStream = request.headers.accept === 'text/event-stream';
    const db = getDb();

    if (!isStream) {
      const alerts = db.prepare(`
        SELECT a.*, b.from_stop, b.to_stop, b.needs, b.code as booking_code,
               u.name as passenger_name, t.scheduled_departs, r.number as route_number
        FROM alerts a
        JOIN bookings b ON a.booking_id = b.id
        JOIN users u ON b.user_id = u.id
        JOIN trips t ON a.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        ORDER BY a.created_at DESC
        LIMIT 50
      `).all() as any[];

      return reply.send(alerts.map(a => ({
        ...a,
        needs: JSON.parse(a.needs || '[]')
      })));
    }

    // SSE Stream for Conductor
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.flushHeaders();

    const newAlertHandler = (alert: any) => {
      reply.raw.write(`data: ${JSON.stringify({ type: 'new_alert', alert })}\n\n`);
    };

    alertsEventEmitter.on('new_alert', newAlertHandler);

    const heartbeat = setInterval(() => {
      reply.raw.write(': heartbeat\n\n');
    }, 15000);

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      alertsEventEmitter.off('new_alert', newAlertHandler);
    });
  });

  // Acknowledge alert
  server.post('/api/conductor/alerts/:id/ack', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { conductorId } = (request.body as { conductorId?: string }) || {};
    const result = acknowledgeAlert(id, conductorId);
    return reply.send(result);
  });

  // Record outcome: boarded or no_show
  server.post('/api/conductor/alerts/:id/outcome', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { outcome } = request.body as { outcome: 'boarded' | 'no_show' };

    if (!outcome || !['boarded', 'no_show'].includes(outcome)) {
      return reply.status(400).send({ error: { code: 'INVALID_OUTCOME', message: 'Outcome must be boarded or no_show' } });
    }

    const result = recordConductorOutcome(id, outcome);
    return reply.send(result);
  });
};
