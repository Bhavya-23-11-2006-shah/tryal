#!/usr/bin/env node
// Railway startup: build, seed if fresh DB, then start
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const dataDir = process.env.DATABASE_PATH
  ? join(process.env.DATABASE_PATH, '..')
  : './data';

// Ensure data directory exists
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log(`[startup] Created data directory: ${dataDir}`);
}

const dbPath = process.env.DATABASE_PATH || './data/saathibus.db';
const isNewDb = !existsSync(dbPath);

if (isNewDb) {
  console.log('[startup] Fresh database detected — running seed...');
  try {
    execSync('node dist/db/seed.js', { stdio: 'inherit' });
    console.log('[startup] Seed complete.');
  } catch (e) {
    console.error('[startup] Seed failed (non-fatal, schema will auto-create):', e.message);
  }
}

console.log('[startup] Starting SaathiBus backend...');
// Hand off to the actual server
import('./dist/server/index.js');
