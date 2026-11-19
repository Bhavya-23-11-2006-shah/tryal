import { describe, it, expect, beforeAll } from 'vitest';
import { seedDatabase } from '../db/seed.js';
import { searchNearestTrips, resolveStop, timeToMinutes, minutesToTime } from '../services/search/nearest-time.js';

describe('Nearest-Time Search Engine', () => {
  const testDate = new Date().toISOString().split('T')[0];

  beforeAll(() => {
    seedDatabase();
  });

  describe('Time utility conversions', () => {
    it('1. correctly converts HH:mm to minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('09:15')).toBe(555);
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    it('2. correctly converts minutes to HH:mm string', () => {
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(555)).toBe('09:15');
      expect(minutesToTime(1439)).toBe('23:59');
    });

    it('3. handles minute overflow / wrapping gracefully', () => {
      expect(minutesToTime(1445)).toBe('00:05');
    });
  });

  describe('Fuzzy stop name resolution', () => {
    it('4. resolves stop by exact stop ID', () => {
      const stop = resolveStop('stop_esp');
      expect(stop?.name).toBe('Esplanade');
    });

    it('5. resolves stop by English name case-insensitively', () => {
      const stop = resolveStop('esplanade');
      expect(stop?.id).toBe('stop_esp');
    });

    it('6. resolves stop by partial English name', () => {
      const stop = resolveStop('salt lake');
      expect(stop?.id).toBe('stop_slv');
    });

    it('7. resolves stop by Hindi name', () => {
      const stop = resolveStop('एस्प्लेनेड');
      expect(stop?.id).toBe('stop_esp');
    });

    it('8. resolves stop by Bengali name', () => {
      const stop = resolveStop('এসপ্ল্যানেড');
      expect(stop?.id).toBe('stop_esp');
    });

    it('9. returns null for non-existent stop', () => {
      const stop = resolveStop('Gotham City');
      expect(stop).toBeNull();
    });
  });

  describe('Nearest-Time core algorithm and edge cases', () => {
    it('10. returns exact trips when requested within +/- 5 minutes', () => {
      const res = searchNearestTrips({
        from: 'Esplanade',
        to: 'Salt Lake Sector V',
        date: testDate,
        time: '07:15'
      });
      expect(res.exact.length).toBeGreaterThan(0);
      expect(res.before).toBeNull();
      expect(res.after).toBeNull();
      expect(res.exact[0].departs).toBe('07:15');
    });

    it('11. returns nearest-before and nearest-after when no bus runs at requested time', () => {
      // 09:00 has no scheduled bus (services run at 08:42 and 09:25)
      const res = searchNearestTrips({
        from: 'Esplanade',
        to: 'Salt Lake Sector V',
        date: testDate,
        time: '09:00'
      });

      expect(res.exact.length).toBe(0);
      expect(res.before).not.toBeNull();
      expect(res.after).not.toBeNull();
      expect(res.before?.minutesDifference).toBeGreaterThan(0);
      expect(res.after?.minutesDifference).toBeGreaterThan(0);
      expect(res.message).toContain('No bus at 09:00');
    });

    it('12. handles early morning requests before the first bus', () => {
      const res = searchNearestTrips({
        from: 'Esplanade',
        to: 'Salt Lake Sector V',
        date: testDate,
        time: '05:00'
      });
      expect(res.before).toBeNull();
      expect(res.after).not.toBeNull();
      expect(res.message).toContain('earlier than the first bus');
    });

    it('13. handles late night requests after the last bus', () => {
      const res = searchNearestTrips({
        from: 'Esplanade',
        to: 'Salt Lake Sector V',
        date: testDate,
        time: '23:30'
      });
      expect(res.before).not.toBeNull();
      expect(res.after).toBeNull();
      expect(res.message).toContain('Last bus for today was at');
    });

    it('14. filters buses by wheelchair bay and ramp requirement', () => {
      const res = searchNearestTrips({
        from: 'Esplanade',
        to: 'Salt Lake Sector V',
        date: testDate,
        time: '09:00',
        needs: ['wheelchair']
      });
      if (res.before) {
        expect(res.before.features.ramp).toBe(true);
        expect(res.before.bays.free).toBeGreaterThan(0);
      }
      if (res.after) {
        expect(res.after.features.ramp).toBe(true);
        expect(res.after.bays.free).toBeGreaterThan(0);
      }
    });

    it('15. filters buses by audio announcement for visually impaired users', () => {
      const res = searchNearestTrips({
        from: 'Esplanade',
        to: 'Salt Lake Sector V',
        date: testDate,
        time: '09:00',
        needs: ['visual']
      });
      if (res.before) expect(res.before.features.audio_announce).toBe(true);
      if (res.after) expect(res.after.features.audio_announce).toBe(true);
    });

    it('16. filters buses by visual display for deaf / hard-of-hearing users', () => {
      const res = searchNearestTrips({
        from: 'Esplanade',
        to: 'Salt Lake Sector V',
        date: testDate,
        time: '09:00',
        needs: ['hearing']
      });
      if (res.before) expect(res.before.features.visual_display).toBe(true);
      if (res.after) expect(res.after.features.visual_display).toBe(true);
    });

    it('17. throws 404 error when from stop is invalid', () => {
      expect(() => {
        searchNearestTrips({
          from: 'Nowhere',
          to: 'Esplanade',
          date: testDate,
          time: '09:00'
        });
      }).toThrow('not recognized');
    });

    it('18. throws 400 error when from and to stops are identical', () => {
      expect(() => {
        searchNearestTrips({
          from: 'Esplanade',
          to: 'Esplanade',
          date: testDate,
          time: '09:00'
        });
      }).toThrow('cannot be the same');
    });

    it('19. does not return trips running in reverse direction', () => {
      // Line 12 runs Esplanade -> Salt Lake. Salt Lake -> Esplanade is served by Line 12R
      const res = searchNearestTrips({
        from: 'Salt Lake Sector V',
        to: 'Esplanade',
        date: testDate,
        time: '09:00'
      });
      const sampleTrip = res.before || res.after;
      expect(sampleTrip?.routeId).toBe('route_12R');
    });

    it('20. provides multilingual messages in English, Hindi, and Bengali', () => {
      const res = searchNearestTrips({
        from: 'Esplanade',
        to: 'Salt Lake Sector V',
        date: testDate,
        time: '09:00'
      });
      expect(res.messages_by_lang.en).toBeTruthy();
      expect(res.messages_by_lang.hi).toBeTruthy();
      expect(res.messages_by_lang.bn).toBeTruthy();
    });

    it('21. sets 0 concession fare for passengers with disabilities', () => {
      const res = searchNearestTrips({
        from: 'Esplanade',
        to: 'Salt Lake Sector V',
        date: testDate,
        time: '07:15'
      });
      expect(res.exact[0].concessionFare).toBe(0);
      expect(res.exact[0].fare).toBe(25);
    });

    it('22. accurately includes delay in effective departure and arrival calculations', () => {
      // 08:42 trip on route 12 was seeded with 5 min delay
      const res = searchNearestTrips({
        from: 'Esplanade',
        to: 'Salt Lake Sector V',
        date: testDate,
        time: '08:45'
      });
      // Scheduled 08:42 + 5 min delay = 08:47 effective departure at Esplanade
      const delayedTrip = res.exact.find(t => t.delayMin === 5);
      if (delayedTrip) {
        expect(delayedTrip.departs).toBe('08:47');
      }
    });
  });
});
