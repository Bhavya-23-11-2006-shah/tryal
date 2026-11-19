-- SaathiBus SQLite Database Schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS stops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  name_bn TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  direction TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS route_stops (
  route_id TEXT NOT NULL,
  stop_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  offset_min INTEGER NOT NULL,
  PRIMARY KEY (route_id, stop_id),
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS buses (
  id TEXT PRIMARY KEY,
  reg_no TEXT NOT NULL,
  route_id TEXT NOT NULL,
  features TEXT NOT NULL, -- JSON: low_floor, ramp, wheelchair_bays, priority_seats, audio_announce, visual_display, tactile_signs, guide_dog_space
  FOREIGN KEY (route_id) REFERENCES routes(id)
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  bus_id TEXT NOT NULL,
  service_date TEXT NOT NULL, -- YYYY-MM-DD
  scheduled_departs TEXT NOT NULL, -- HH:mm
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, running, completed, cancelled
  delay_min INTEGER NOT NULL DEFAULT 0,
  crowd_level TEXT NOT NULL DEFAULT 'moderate', -- low, moderate, high
  FOREIGN KEY (route_id) REFERENCES routes(id),
  FOREIGN KEY (bus_id) REFERENCES buses(id)
);

CREATE TABLE IF NOT EXISTS seats (
  id TEXT PRIMARY KEY,
  bus_id TEXT NOT NULL,
  label TEXT NOT NULL,
  kind TEXT NOT NULL, -- regular, priority, wheelchair_bay, companion
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trip_seats (
  trip_id TEXT NOT NULL,
  seat_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'free', -- free, held, booked
  hold_expires_at INTEGER, -- epoch ms
  booking_id TEXT,
  PRIMARY KEY (trip_id, seat_id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'passenger', -- passenger, caregiver, conductor, depot
  language TEXT NOT NULL DEFAULT 'en', -- en, hi, bn
  profile TEXT, -- JSON: accessibility flags (blind, deaf, wheelchair, etc.)
  emergency_contact_enc TEXT, -- AES-256-GCM encrypted
  consent_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- 6-character unambiguous code
  user_id TEXT NOT NULL,
  booked_for_name TEXT,
  trip_id TEXT NOT NULL,
  seat_id TEXT NOT NULL,
  from_stop TEXT NOT NULL,
  to_stop TEXT NOT NULL,
  needs TEXT NOT NULL, -- JSON array
  companion INTEGER NOT NULL DEFAULT 0,
  companion_seat_id TEXT,
  guide_dog INTEGER NOT NULL DEFAULT 0,
  note_enc TEXT, -- AES-256-GCM encrypted
  status TEXT NOT NULL DEFAULT 'confirmed', -- held, confirmed, cancelled, completed, no_show, waitlisted
  idempotency_key TEXT UNIQUE,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (seat_id) REFERENCES seats(id)
);

CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  needs TEXT NOT NULL, -- JSON
  position INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS conductors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bus_id TEXT NOT NULL,
  shift_code_hash TEXT NOT NULL, -- hashed shift code
  FOREIGN KEY (bus_id) REFERENCES buses(id)
);

CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  conductor_id TEXT NOT NULL,
  trip_id TEXT NOT NULL,
  FOREIGN KEY (conductor_id) REFERENCES conductors(id),
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  trip_id TEXT NOT NULL,
  conductor_id TEXT,
  severity TEXT NOT NULL DEFAULT 'high',
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent', -- sent, acknowledged, escalated, resolved
  created_at INTEGER NOT NULL,
  ack_at INTEGER,
  escalated_at INTEGER,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE TABLE IF NOT EXISTS booking_events (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  type TEXT NOT NULL, -- booked, conductor_notified, conductor_ack, bus_approaching, boarding_ready, completed, cancelled
  payload TEXT, -- JSON
  created_at INTEGER NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assistant_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  state TEXT NOT NULL, -- JSON
  pending_action TEXT, -- JSON
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sos_events (
  id TEXT PRIMARY KEY,
  booking_id TEXT,
  user_id TEXT,
  lat REAL,
  lng REAL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_trips_route_date ON trips(route_id, service_date);
CREATE INDEX IF NOT EXISTS idx_trip_seats_state ON trip_seats(trip_id, state);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_trip ON alerts(trip_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_events_booking ON booking_events(booking_id, created_at);
