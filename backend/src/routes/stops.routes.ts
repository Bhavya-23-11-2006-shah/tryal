import { FastifyPluginAsync } from 'fastify';
import { getDb } from '../db/index.js';

export const stopsRoutes: FastifyPluginAsync = async (server) => {
  server.get('/api/stops', async (request, reply) => {
    const { q } = request.query as { q?: string };
    const db = getDb();

    if (!q || q.trim() === '') {
      const stops = db.prepare('SELECT id, name, name_hi, name_bn, lat, lng FROM stops ORDER BY name ASC').all();
      return reply.send(stops);
    }

    const term = `%${q.trim().toLowerCase()}%`;
    const filtered = db.prepare(`
      SELECT id, name, name_hi, name_bn, lat, lng 
      FROM stops 
      WHERE LOWER(name) LIKE ? OR LOWER(name_hi) LIKE ? OR LOWER(name_bn) LIKE ? OR LOWER(id) LIKE ?
      ORDER BY name ASC
    `).all(term, term, term, term);

    return reply.send(filtered);
  });
};
