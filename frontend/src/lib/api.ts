import { MOCK_STOPS, mockSearchTrips, MOCK_BOOKINGS, MOCK_ALERTS } from '../mock/mock-adapter.ts';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const FORCE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export interface AssistantApiResponse {
  intent: string;
  slots?: {
    from?: string;
    to?: string;
    date?: string;
    time?: string;
    needs?: string[];
    bookingId?: string;
    choice?: string;
    tripId?: string;
    routeNumber?: string;
    departs?: string;
  };
  reply_text: string;
  ui_action?: string;
  needs_confirmation: boolean;
  suggestions?: string[];
}

export function getVoiceSessionId(): string {
  if (typeof window === 'undefined') return 'sess_default';
  let sid = window.sessionStorage.getItem('saathibus_voice_session');
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    window.sessionStorage.setItem('saathibus_voice_session', sid);
  }
  return sid;
}

export function resetVoiceSession(): string {
  if (typeof window === 'undefined') return 'sess_default';
  const newSid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  window.sessionStorage.setItem('saathibus_voice_session', newSid);
  return newSid;
}

async function safeFetch<T>(endpoint: string, options?: RequestInit, mockFallback?: () => T): Promise<T> {
  if (FORCE_MOCK && mockFallback) {
    return mockFallback();
  }

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'usr_asha',
        ...(options?.headers || {})
      }
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn(`API call ${endpoint} failed, falling back to mock adapter:`, err);
    if (mockFallback) return mockFallback();
    throw err;
  }
}

export const api = {
  // 1. Health
  getHealth: () => safeFetch('/api/health', undefined, () => ({ status: 'healthy', demo: true })),

  // 2. Stops
  getStops: (q?: string) =>
    safeFetch(
      `/api/stops${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      undefined,
      () => {
        if (!q) return MOCK_STOPS;
        const lower = q.toLowerCase();
        return MOCK_STOPS.filter(s => s.name.toLowerCase().includes(lower) || s.name_hi.includes(lower) || s.name_bn.includes(lower));
      }
    ),

  // 3. Search Trips with Nearest-Time
  searchTrips: (from: string, to: string, date: string, time: string, needs: string[] = [], language = 'en') =>
    safeFetch(
      `/api/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&time=${time}&needs=${needs.join(',')}&language=${language}`,
      undefined,
      () => mockSearchTrips(from, to, date, time, needs)
    ),

  // 4. Trip details & seats
  getTrip: (tripId: string) =>
    safeFetch(
      `/api/trips/${tripId}`,
      undefined,
      () => ({
        id: tripId,
        route_number: 'Line 12',
        route_name: 'Esplanade to Salt Lake Sec V',
        reg_no: 'WB-01-A-1001',
        features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true },
        seats: [
          { id: 'bay_1', label: 'Wheelchair Bay 1', kind: 'wheelchair_bay', state: 'free' },
          { id: 'bay_2', label: 'Wheelchair Bay 2', kind: 'wheelchair_bay', state: 'free' },
          { id: 'pri_1', label: 'Priority Seat 1 (Audio Guide)', kind: 'priority_seat', state: 'free' },
          { id: 'pri_2', label: 'Priority Seat 2', kind: 'priority_seat', state: 'free' },
          { id: 'pri_3', label: 'Priority Seat 3', kind: 'priority_seat', state: 'booked' },
          { id: 'pri_4', label: 'Priority Seat 4', kind: 'priority_seat', state: 'free' },
          { id: 'comp_1', label: 'Companion Seat 1', kind: 'companion', state: 'free' },
          { id: 'reg_1', label: 'Seat 1', kind: 'regular', state: 'free' },
          { id: 'reg_2', label: 'Seat 2', kind: 'regular', state: 'free' }
        ]
      })
    ),

  // 5. Bookings
  createBooking: (payload: any) =>
    safeFetch(
      '/api/bookings',
      { method: 'POST', body: JSON.stringify(payload) },
      () => {
        const newBooking = {
          id: `bkg_${Date.now()}`,
          code: '7K9X2M',
          userId: 'usr_asha',
          tripId: payload.tripId,
          seatId: payload.seatId || 'bay_1',
          seatLabel: 'Wheelchair Bay 1',
          fromStop: payload.fromStop,
          toStop: payload.toStop,
          routeNumber: 'Line 12',
          departs: '08:42 AM',
          serviceDate: new Date().toISOString().split('T')[0],
          needs: payload.needs || [],
          guideDog: payload.guideDog || false,
          status: 'confirmed',
          createdAt: Date.now()
        };
        MOCK_BOOKINGS.unshift(newBooking);
        return newBooking;
      }
    ),

  getBookings: () => safeFetch('/api/bookings', undefined, () => MOCK_BOOKINGS),

  getBooking: (id: string) =>
    safeFetch('/api/bookings/' + id, undefined, () => {
      const found = MOCK_BOOKINGS.find(b => b.id === id || b.code === id) || MOCK_BOOKINGS[0];
      return {
        ...found,
        tracking: {
          currentStopName: 'Esplanade',
          nextStopName: 'Sealdah',
          progressPercent: 35,
          etaMinutes: 12,
          delayMin: 0
        }
      };
    }),

  cancelBooking: (id: string) =>
    safeFetch(`/api/bookings/${id}`, { method: 'DELETE' }, () => ({ success: true })),

  // 6. Voice Assistant
  sendAssistantMessage: (text: string, language = 'en', profile?: any, sessionId?: string) => {
    const activeSession = sessionId || getVoiceSessionId();
    return safeFetch<AssistantApiResponse>(
      '/api/assistant/message',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId: activeSession, text, language, profile })
      },
      () => {
        const clean = text.toLowerCase().trim();
        if (/^(yes|yeah|yep|confirm|ha|haan|sahi|thik|হাঁ|হ্যাঁ|ঠিক|हां|हाँ|पुष्टि|book it|book the bus)/i.test(clean)) {
          const newBooking = {
            id: 'bkg_' + Date.now(),
            code: '8KG5QD',
            tripId: 'trp_mock_1',
            seatId: 'bay_1',
            seatLabel: 'Wheelchair Bay 1',
            fromStop: 'Esplanade',
            toStop: 'Salt Lake Sector V',
            routeNumber: 'Line 12',
            departs: '09:00 AM',
            serviceDate: new Date().toISOString().split('T')[0],
            needs: profile?.needs || ['wheelchair'],
            guideDog: profile?.guideDog || false,
            status: 'confirmed',
            createdAt: Date.now()
          };
          MOCK_BOOKINGS.unshift(newBooking);
          resetVoiceSession();
          return {
            intent: 'confirm',
            slots: { bookingId: newBooking.id },
            reply_text: language === 'hi'
              ? 'बधाई हो! आपकी सीट 8KG5QD कोड के साथ बुक हो गई है। लाइव टिकट खोला जा रहा है।'
              : language === 'bn'
              ? 'অভিনন্দন! আপনার আসন কোড 8KG5QD দিয়ে বুক করা হয়েছে। লাইভ টিকিট খোলা হচ্ছে।'
              : 'Booking confirmed! Your bus pass code is 8KG5QD. Opening your confirmed live ticket now.',
            ui_action: 'NAVIGATE_TICKET',
            needs_confirmation: false
          };
        }
        if (clean.includes('salt lake') || clean.includes('সল্টলেক') || clean.includes('साल्ट लेक')) {
          return {
            intent: 'plan_trip',
            slots: {
              from: 'Esplanade',
              to: 'Salt Lake Sector V',
              time: '09:00',
              routeNumber: 'Line 12',
              departs: '09:00 AM'
            },
            reply_text: language === 'hi'
              ? 'एस्प्लेनेड से साल्ट लेक के लिए 9:00 बजे लाइन 12 बस उपलब्ध है। क्या आप इसे बुक करना चाहते हैं? हाँ बोलें या पुष्टि करें।'
              : language === 'bn'
              ? 'এসপ্ল্যানেড থেকে সল্টলেক সকাল ৯:০০ টায় লাইন ১২ বাস পাওয়া গেছে। আপনি কি এটি বুক করতে চান? হ্যাঁ বলুন।'
              : 'Accessible bus found on Line 12 from Esplanade to Salt Lake Sector V at 09:00 AM. Would you like to confirm and book this bus? Please say yes to confirm.',
            ui_action: 'EXECUTE_SEARCH',
            needs_confirmation: true,
            suggestions: ['Yes, confirm', 'Choose another time']
          };
        }
        if (clean.includes('airport') || clean.includes('हवाई') || clean.includes('বিমান')) {
          return {
            intent: 'plan_trip',
            slots: {
              from: 'Howrah Station',
              to: 'Airport Gate 1',
              time: '10:00',
              routeNumber: 'Line 24',
              departs: '10:00 AM'
            },
            reply_text: language === 'hi'
              ? 'हावड़ा से एयरपोर्ट गेट 1 के लिए सुबह 10:00 बजे लाइन 24 बस तैयार है। क्या आप बुक करना चाहते हैं? हाँ बोलें।'
              : language === 'bn'
              ? 'হাওড়া থেকে বিমানবন্দর সকাল ১০:০০ টায় লাইন ২৪ বাস প্রস্তুত। বুক করতে চাইলে হ্যাঁ বলুন।'
              : 'Found accessible bus on Line 24 from Howrah Station to Airport Gate 1 at 10:00 AM. Would you like to confirm and book this bus? Please say yes to confirm.',
            ui_action: 'EXECUTE_SEARCH',
            needs_confirmation: true,
            suggestions: ['Yes, confirm', 'Cancel']
          };
        }
        return {
          intent: 'help',
          reply_text: language === 'hi'
            ? 'नमस्ते! मैं साथी बस सहायक हूँ। आप कहाँ जाना चाहते हैं? जैसे: साल्ट लेक या एयरपोर्ट।'
            : language === 'bn'
            ? 'নমস্কার! আমি সাথীবাস সহকারী। আপনি কোথায় যেতে চান? যেমন: সল্টলেক বা বিমানবন্দর।'
            : 'Hello! I am your SaathiBus voice assistant. Where would you like to travel? Speak or type, for example "Book bus to Salt Lake at 9 AM".',
          needs_confirmation: false,
          suggestions: ['To Salt Lake at 9 AM', 'Howrah to Airport', 'Help me']
        };
      }
    );
  },

  // 7. SOS
  sendSos: (payload: any) =>
    safeFetch('/api/sos', { method: 'POST', body: JSON.stringify(payload) }, () => ({
      success: true,
      message: 'Emergency SOS activated. Central transit dispatch notified.'
    })),

  // 8. Conductor
  getConductorAlerts: () => safeFetch('/api/conductor/alerts', undefined, () => MOCK_ALERTS),

  acknowledgeConductorAlert: (alertId: string) =>
    safeFetch(`/api/conductor/alerts/${alertId}/ack`, { method: 'POST' }, () => ({
      success: true,
      alert: { id: alertId, status: 'acknowledged' }
    })),

  recordConductorOutcome: (alertId: string, outcome: 'boarded' | 'no_show') =>
    safeFetch(`/api/conductor/alerts/${alertId}/outcome`, { method: 'POST', body: JSON.stringify({ outcome }) }, () => ({
      success: true
    })),

  // 9. Concession verification
  verifyConcession: (idNumber: string) =>
    safeFetch('/api/concession/verify', { method: 'POST', body: JSON.stringify({ idNumber }) }, () => ({
      verified: true,
      type: 'UDID National Card',
      message: 'Verified. Concession fare applied.'
    }))
};
