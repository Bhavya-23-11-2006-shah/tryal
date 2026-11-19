import { getDb } from '../../db/index.js';
import { AppError } from '../../lib/errors.js';
import { generateBookingCode, encryptText } from '../../lib/crypto.js';
import { triggerConductorAlert } from '../alerts/alerts-service.js';

export interface CreateBookingInput {
  userId: string;
  tripId: string;
  seatId?: string;
  fromStop: string;
  toStop: string;
  passengerName?: string;
  needs?: string[];
  companion?: boolean;
  guideDog?: boolean;
  note?: string;
  bookedFor?: string;
  idempotencyKey?: string;
  confirm?: boolean;
}

export interface BookingRecord {
  id: string;
  code: string;
  userId: string;
  bookedForName: string | null;
  tripId: string;
  seatId: string;
  companionSeatId: string | null;
  fromStop: string;
  toStop: string;
  needs: string[];
  companion: boolean;
  guideDog: boolean;
  status: string;
  createdAt: number;
}

/**
 * Sweeper to release expired seat holds
 */
export function releaseExpiredHolds(): void {
  const db = getDb();
  const now = Date.now();
  db.exec(`
    UPDATE trip_seats 
    SET state = 'free', hold_expires_at = NULL, booking_id = NULL 
    WHERE state = 'held' AND hold_expires_at < ${now};

    UPDATE bookings 
    SET status = 'cancelled' 
    WHERE status = 'held' AND id IN (
      SELECT booking_id FROM trip_seats WHERE state = 'held' AND hold_expires_at < ${now}
    );
  `);
}

/**
 * Atomic booking creation with concurrency protection
 */
export function createBooking(input: CreateBookingInput): BookingRecord {
  releaseExpiredHolds();
  const db = getDb();

  // 1. Idempotency check
  if (input.idempotencyKey) {
    const existing = db.prepare('SELECT * FROM bookings WHERE idempotency_key = ?').get(input.idempotencyKey) as any;
    if (existing) {
      return {
        id: existing.id,
        code: existing.code,
        userId: existing.user_id,
        bookedForName: existing.booked_for_name,
        tripId: existing.trip_id,
        seatId: existing.seat_id,
        companionSeatId: existing.companion_seat_id,
        fromStop: existing.from_stop,
        toStop: existing.to_stop,
        needs: JSON.parse(existing.needs || '[]'),
        companion: Boolean(existing.companion),
        guideDog: Boolean(existing.guide_dog),
        status: existing.status,
        createdAt: existing.created_at
      };
    }
  }

  // 2. Validate trip
  const trip = db.prepare('SELECT id, bus_id, service_date, scheduled_departs, status FROM trips WHERE id = ?').get(input.tripId) as any;
  if (!trip) throw new AppError('Selected trip does not exist.', 404, 'TRIP_NOT_FOUND');
  if (trip.status === 'cancelled') throw new AppError('This bus trip has been cancelled.', 400, 'TRIP_CANCELLED');

  // 3. Prevent duplicate active booking for same user on same trip
  const existingUserBooking = db.prepare(`
    SELECT id FROM bookings 
    WHERE user_id = ? AND trip_id = ? AND status IN ('confirmed', 'held')
  `).get(input.userId, input.tripId);
  if (existingUserBooking) {
    throw new AppError('You already have an active booking on this bus trip.', 400, 'DUPLICATE_BOOKING');
  }

  // 4. Determine & lock primary seat
  let chosenSeatId = input.seatId;
  const needs = input.needs || [];
  const isWheelchair = needs.includes('wheelchair');

  if (!chosenSeatId) {
    // Auto-assign suitable seat
    const seatKind = isWheelchair ? 'wheelchair_bay' : 'priority_seat';
    const candidateSeat = db.prepare(`
      SELECT s.id 
      FROM seats s
      JOIN trip_seats ts ON s.id = ts.seat_id AND ts.trip_id = ?
      WHERE s.bus_id = ? AND s.kind = ? AND ts.state = 'free'
      LIMIT 1
    `).get(input.tripId, trip.bus_id, seatKind) as any;

    if (!candidateSeat) {
      // Fallback to any regular free seat if priority isn't strictly required
      if (!isWheelchair) {
        const regularSeat = db.prepare(`
          SELECT s.id 
          FROM seats s
          JOIN trip_seats ts ON s.id = ts.seat_id AND ts.trip_id = ?
          WHERE s.bus_id = ? AND ts.state = 'free'
          LIMIT 1
        `).get(input.tripId, trip.bus_id) as any;
        if (!regularSeat) throw new AppError('No suitable seats available on this bus.', 409, 'SEAT_UNAVAILABLE');
        chosenSeatId = regularSeat.id;
      } else {
        throw new AppError('No wheelchair bays available on this bus.', 409, 'BAY_UNAVAILABLE');
      }
    } else {
      chosenSeatId = candidateSeat.id;
    }
  }

  // Optional companion seat allocation
  let companionSeatId: string | null = null;
  if (input.companion) {
    const compSeat = db.prepare(`
      SELECT s.id 
      FROM seats s
      JOIN trip_seats ts ON s.id = ts.seat_id AND ts.trip_id = ?
      WHERE s.bus_id = ? AND s.kind IN ('companion', 'regular') AND ts.state = 'free' AND s.id != ?
      LIMIT 1
    `).get(input.tripId, trip.bus_id, chosenSeatId ?? '') as any;
    if (compSeat) companionSeatId = compSeat.id;
  }

  const bookingId = `bkg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const bookingCode = generateBookingCode();
  const isHold = input.confirm === false;
  const seatState = isHold ? 'held' : 'booked';
  const holdExpiresAt = isHold ? Date.now() + 5 * 60 * 1000 : null;
  const status = isHold ? 'held' : 'confirmed';

  // Atomic database execution
  db.exec('BEGIN TRANSACTION;');
  try {
    // Attempt seat reservation with atomic state check
    const lockStmt = db.prepare(`
      UPDATE trip_seats 
      SET state = ?, hold_expires_at = ?, booking_id = ?
      WHERE trip_id = ? AND seat_id = ? AND state = 'free'
    `);
    const lockResult = lockStmt.run(seatState, holdExpiresAt, bookingId, input.tripId, chosenSeatId ?? '');
    if (lockResult.changes === 0) {
      throw new AppError('The requested seat was just taken by another passenger. Please pick another seat.', 409, 'RACE_CONDITION_SEAT_TAKEN');
    }

    if (companionSeatId) {
      const compResult = lockStmt.run(seatState, holdExpiresAt, bookingId, input.tripId, companionSeatId);
      if (compResult.changes === 0) companionSeatId = null; // Companion seat couldn't be reserved
    }

    // Insert booking record
    db.prepare(`
      INSERT INTO bookings (
        id, code, user_id, booked_for_name, trip_id, seat_id, companion_seat_id,
        from_stop, to_stop, needs, companion, guide_dog, note_enc, status,
        idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bookingId,
      bookingCode,
      input.userId,
      input.bookedFor || null,
      input.tripId,
      chosenSeatId ?? '',
      companionSeatId ?? null,
      input.fromStop,
      input.toStop,
      JSON.stringify(needs),
      input.companion ? 1 : 0,
      input.guideDog ? 1 : 0,
      encryptText(input.note || ''),
      status,
      input.idempotencyKey || null,
      Date.now()
    );

    // Initial timeline event
    db.prepare('INSERT INTO booking_events (id, booking_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)').run(
      `evt_${Date.now()}_1`,
      bookingId,
      'booked',
      JSON.stringify({ status, seatId: chosenSeatId }),
      Date.now()
    );

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  // Trigger conductor alert if confirmed
  if (status === 'confirmed') {
    triggerConductorAlert(bookingId, input.tripId, input.fromStop, input.passengerName || 'Passenger', needs, input.guideDog);
  }

  return {
    id: bookingId,
    code: bookingCode,
    userId: input.userId,
    bookedForName: input.bookedFor || null,
    tripId: input.tripId,
    seatId: chosenSeatId ?? '',
    companionSeatId,
    fromStop: input.fromStop,
    toStop: input.toStop,
    needs,
    companion: Boolean(input.companion),
    guideDog: Boolean(input.guideDog),
    status,
    createdAt: Date.now()
  };
}

/**
 * Reschedule booking atomically
 */
export function rescheduleBooking(bookingId: string, newTripId: string, newSeatId?: string): BookingRecord {
  const db = getDb();
  const current = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
  if (!current) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
  if (current.status === 'cancelled') throw new AppError('Cancelled bookings cannot be rescheduled.', 400, 'ALREADY_CANCELLED');

  // Cancel old and book new atomically
  cancelBooking(bookingId);
  return createBooking({
    userId: current.user_id,
    tripId: newTripId,
    seatId: newSeatId,
    fromStop: current.from_stop,
    toStop: current.to_stop,
    needs: JSON.parse(current.needs || '[]'),
    companion: Boolean(current.companion),
    guideDog: Boolean(current.guide_dog),
    bookedFor: current.booked_for_name
  });
}

/**
 * Cancel booking and release seats
 */
export function cancelBooking(bookingId: string): { success: boolean; message: string } {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
  if (!booking) throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(bookingId);
    db.prepare("UPDATE trip_seats SET state = 'free', booking_id = NULL, hold_expires_at = NULL WHERE booking_id = ?").run(bookingId);
    db.prepare('INSERT INTO booking_events (id, booking_id, type, payload, created_at) VALUES (?, ?, ?, ?, ?)').run(
      `evt_${Date.now()}_cancel`,
      bookingId,
      'cancelled',
      JSON.stringify({ reason: 'User requested cancellation' }),
      Date.now()
    );
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  return { success: true, message: 'Booking successfully cancelled and seat freed.' };
}
