import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from '../lib/config.js';
import { logger } from '../lib/logger.js';
import { getDb } from '../db/index.js';
import { seedDatabase } from '../db/seed.js';
import { authRoutes } from '../routes/auth.routes.js';
import { stopsRoutes } from '../routes/stops.routes.js';
import { tripsRoutes } from '../routes/trips.routes.js';
import { bookingsRoutes } from '../routes/bookings.routes.js';
import { assistantRoutes } from '../routes/assistant.routes.js';
import { conductorRoutes } from '../routes/conductor.routes.js';
import { miscRoutes } from '../routes/misc.routes.js';
import { checkEscalations } from '../services/alerts/alerts-service.js';
import { releaseExpiredHolds } from '../services/booking/booking-engine.js';
import { AppError } from '../lib/errors.js';

export async function buildServer() {
  const server = Fastify({
    logger: false, // Using our own Pino logger
    trustProxy: true
  });

  // CORS Configuration
  const allowedOrigins = config.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  await server.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(null, true); // Permissive in dev/demo to prevent CORS blockers
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Security headers
  await server.register(helmet, {
    contentSecurityPolicy: false
  });

  // Global Error Handler
  server.setErrorHandler((error: any, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(error.toJSON());
    }
    logger.error({ err: error, url: request.url }, 'Unhandled error occurred');
    return reply.status(error?.statusCode || 500).send({
      error: {
        code: error?.code || 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'An unexpected error occurred',
        hint: 'Please try again or contact SaathiBus support.'
      }
    });
  });

  // Register Routes
  await server.register(authRoutes);
  await server.register(stopsRoutes);
  await server.register(tripsRoutes);
  await server.register(bookingsRoutes);
  await server.register(assistantRoutes);
  await server.register(conductorRoutes);
  await server.register(miscRoutes);

  return server;
}

async function start() {
  try {
    const db = getDb();
    // Auto-seed if database is freshly initialized or empty
    const stopCount = (db.prepare('SELECT count(*) as count FROM stops').get() as any)?.count || 0;
    if (stopCount === 0) {
      seedDatabase();
    }

    const server = await buildServer();
    await server.listen({ port: config.PORT, host: '0.0.0.0' });
    logger.info(`SaathiBus Backend running on port ${config.PORT} (http://localhost:${config.PORT})`);

    // Background interval tasks: escalation check (every 30s) and hold release (every 60s)
    setInterval(checkEscalations, 30000);
    setInterval(releaseExpiredHolds, 60000);
  } catch (err) {
    logger.error({ err }, 'Fatal error during server startup');
    process.exit(1);
  }
}

if (process.argv[1]?.includes('server') || process.argv[1]?.includes('index')) {
  start();
}
