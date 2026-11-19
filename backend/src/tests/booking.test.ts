import { describe, it, expect, beforeAll } from 'vitest';
import { seedDatabase } from '../db/seed.js';
import { createBooking, cancelBooking, rescheduleBooking } from '../services/booking/booking-engine.js';
import { getDb } from '../db/index.js';

describe('Booking Engine & Concurrency Safety', () => {
  const testDate = new Date().toISOString().split('T')[0];
  const testTripId = `trip_route_12_${testDate}_0715`;

  beforeAll(() => {
    seedDatabase();
  });

  it('1. successfully creates an accessible bus booking', () => {
    const booking = createBooking({
      userId: 'usr_rohan',
      tripId: testTripId,
      fromStop: 'Esplanade',
      toStop: 'Salt Lake Sector V',
      needs: ['wheelchair', 'ramp'],
      guideDog: false
    });

    expect(booking.id).toBeTruthy();
    expect(booking.code).toHaveLength(6);
    expect(booking.status).toBe('confirmed');
    expect(booking.needs).toContain('wheelchair');
  });

  it('2. respects idempotency key and never creates duplicate booking', () => {
    const key = `idem_${Date.now()}`;
    const booking1 = createBooking({
      userId: 'usr_dev',
      tripId: testTripId,
      fromStop: 'Esplanade',
      toStop: 'Salt Lake Sector V',
      idempotencyKey: key
    });

    const booking2 = createBooking({
      userId: 'usr_dev',
      tripId: testTripId,
      fromStop: 'Esplanade',
      toStop: 'Salt Lake Sector V',
      idempotencyKey: key
    });

    expect(booking1.id).toBe(booking2.id);
    expect(booking1.code).toBe(booking2.code);
  });

  it('3. guards against double booking when seat is requested concurrently', () => {
    const db = getDb();
    const freeSeat = db.prepare(`
      SELECT s.id 
      FROM seats s 
      JOIN trip_seats ts ON s.id = ts.seat_id AND ts.trip_id = ? 
      WHERE ts.state = 'free' 
      LIMIT 1
    `).get(testTripId) as any;

    expect(freeSeat).toBeTruthy();

    // User A books the seat
    const userABooking = createBooking({
      userId: 'usr_asha',
      tripId: testTripId,
      seatId: freeSeat.id,
      fromStop: 'Esplanade',
      toStop: 'Salt Lake Sector V'
    });
    expect(userABooking.status).toBe('confirmed');

    // User B attempts to book the EXACT same seat concurrently -> must throw 409
    expect(() => {
      createBooking({
        userId: 'usr_meera',
        tripId: testTripId,
        seatId: freeSeat.id,
        fromStop: 'Esplanade',
        toStop: 'Salt Lake Sector V'
      });
    }).toThrow('just taken by another passenger');
  });

  it('4. cancels booking and releases seat', () => {
    const cancelTripId = `trip_route_12_${testDate}_1300`;
    const booking = createBooking({
      userId: 'usr_rohan',
      tripId: cancelTripId,
      fromStop: 'Esplanade',
      toStop: 'Salt Lake Sector V'
    });

    const res = cancelBooking(booking.id);
    expect(res.success).toBe(true);

    const db = getDb();
    const bkg = db.prepare('SELECT status FROM bookings WHERE id = ?').get(booking.id) as any;
    expect(bkg.status).toBe('cancelled');

    const seatState = db.prepare('SELECT state FROM trip_seats WHERE trip_id = ? AND seat_id = ?').get(cancelTripId, booking.seatId) as any;
    expect(seatState.state).toBe('free');
  });

  it('5. atomically reschedules booking to another trip', () => {
    const fromTripId = `trip_route_12_${testDate}_1415`;
    const targetTripId = `trip_route_12_${testDate}_1545`;
    const initialBooking = createBooking({
      userId: 'usr_dev',
      tripId: fromTripId,
      fromStop: 'Esplanade',
      toStop: 'Salt Lake Sector V'
    });

    const rescheduled = rescheduleBooking(initialBooking.id, targetTripId);
    expect(rescheduled.tripId).toBe(targetTripId);
    expect(rescheduled.status).toBe('confirmed');

    const db = getDb();
    const oldBkg = db.prepare('SELECT status FROM bookings WHERE id = ?').get(initialBooking.id) as any;
    expect(oldBkg.status).toBe('cancelled');
  });
});
