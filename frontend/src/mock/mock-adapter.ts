// Mock Adapter for SaathiBus Frontend (Offline & Zero-Backend Demo Safety)

export interface MockStop {
  id: string;
  name: string;
  name_hi: string;
  name_bn: string;
  lat: number;
  lng: number;
}

export const MOCK_STOPS: MockStop[] = [
  { id: 'stop_esp', name: 'Esplanade', name_hi: 'एस्प्लेनेड', name_bn: 'এসপ্ল্যানেড', lat: 22.5658, lng: 88.3518 },
  { id: 'stop_how', name: 'Howrah Station', name_hi: 'हावड़ा स्टेशन', name_bn: 'হাওড়া স্টেশন', lat: 22.5850, lng: 88.3426 },
  { id: 'stop_slv', name: 'Salt Lake Sector V', name_hi: 'सॉल्ट लेक सेक्टर 5', name_bn: 'সল্টলেক সেক্টর ৫', lat: 22.5735, lng: 88.4331 },
  { id: 'stop_sea', name: 'Sealdah', name_hi: 'सियालदह', name_bn: 'শিয়ালদহ', lat: 22.5684, lng: 88.3712 },
  { id: 'stop_pst', name: 'Park Street', name_hi: 'पार्क स्ट्रीट', name_bn: 'পার্ক স্ট্রিট', lat: 22.5518, lng: 88.3524 },
  { id: 'stop_gar', name: 'Gariahat', name_hi: 'गड़ियाहाट', name_bn: 'গড়িয়াহাট', lat: 22.5186, lng: 88.3653 },
  { id: 'stop_air', name: 'Airport Gate 1', name_hi: 'हवाई अड्डा गेट 1', name_bn: 'বিমানবন্দর গেট ১', lat: 22.6547, lng: 88.4467 },
  { id: 'stop_dum', name: 'Dum Dum Junction', name_hi: 'दम दम जंक्शन', name_bn: 'দমদম জংশন', lat: 22.6214, lng: 88.3934 },
  { id: 'stop_rub', name: 'Ruby Hospital', name_hi: 'रूबी अस्पताल', name_bn: 'রুবি হাসপাতাল', lat: 22.5134, lng: 88.4029 },
  { id: 'stop_sci', name: 'Science City', name_hi: 'साइंस सिटी', name_bn: 'সায়েন্স সিটি', lat: 22.5401, lng: 88.3965 },
  { id: 'stop_new', name: 'New Town Bus Terminus', name_hi: 'न्यू टाउन बस टर्मिनल', name_bn: 'নিউ টাউন বাস টার্মিনাস', lat: 22.5898, lng: 88.4699 },
  { id: 'stop_beh', name: 'Behala Chowrasta', name_hi: 'बेहाला चौरास्ता', name_bn: 'বেহালা চৌরাস্তা', lat: 22.4975, lng: 88.3182 }
];

export interface MockTrip {
  id: string;
  routeNumber: string;
  routeName: string;
  busRegNo: string;
  departs: string;
  arrives: string;
  durationMin: number;
  status: string;
  delayMin: number;
  crowdLevel: string;
  features: {
    low_floor: boolean;
    ramp: boolean;
    wheelchair_bays: number;
    priority_seats: number;
    audio_announce: boolean;
    visual_display: boolean;
    tactile_signs: boolean;
    guide_dog_space: boolean;
  };
  bays: { total: number; free: number };
  prioritySeats: { total: number; free: number };
  fare: number;
  concessionFare: number;
  minutesDifference?: number;
}

export function mockSearchTrips(from: string, to: string, date: string, time: string, needs: string[] = []): {
  exact: MockTrip[];
  before: MockTrip | null;
  after: MockTrip | null;
  message: string;
} {
  const [reqH, reqM] = timeToMins(time);
  const reqTotal = reqH * 60 + reqM;

  const sampleTrips: MockTrip[] = [
    {
      id: 'trip_12_0715',
      routeNumber: 'Line 12',
      routeName: 'Esplanade to Salt Lake Sec V',
      busRegNo: 'WB-01-A-1001',
      departs: '07:15',
      arrives: '07:53',
      durationMin: 38,
      status: 'scheduled',
      delayMin: 0,
      crowdLevel: 'low',
      features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true },
      bays: { total: 2, free: 2 },
      prioritySeats: { total: 4, free: 3 },
      fare: 25,
      concessionFare: 0
    },
    {
      id: 'trip_12_0842',
      routeNumber: 'Line 12',
      routeName: 'Esplanade to Salt Lake Sec V',
      busRegNo: 'WB-01-A-1002',
      departs: '08:42',
      arrives: '09:20',
      durationMin: 38,
      status: 'scheduled',
      delayMin: 0,
      crowdLevel: 'moderate',
      features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true },
      bays: { total: 2, free: 2 },
      prioritySeats: { total: 4, free: 2 },
      fare: 25,
      concessionFare: 0
    },
    {
      id: 'trip_12_0925',
      routeNumber: 'Line 12',
      routeName: 'Esplanade to Salt Lake Sec V',
      busRegNo: 'WB-01-A-1004',
      departs: '09:25',
      arrives: '10:03',
      durationMin: 38,
      status: 'scheduled',
      delayMin: 0,
      crowdLevel: 'high',
      features: { low_floor: true, ramp: true, wheelchair_bays: 2, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true },
      bays: { total: 2, free: 1 },
      prioritySeats: { total: 4, free: 1 },
      fare: 25,
      concessionFare: 0
    },
    {
      id: 'trip_12_1015',
      routeNumber: 'Line 12',
      routeName: 'Esplanade to Salt Lake Sec V',
      busRegNo: 'WB-01-A-1005',
      departs: '10:15',
      arrives: '10:53',
      durationMin: 38,
      status: 'scheduled',
      delayMin: 0,
      crowdLevel: 'moderate',
      features: { low_floor: true, ramp: true, wheelchair_bays: 1, priority_seats: 4, audio_announce: true, visual_display: true, tactile_signs: true, guide_dog_space: true },
      bays: { total: 1, free: 1 },
      prioritySeats: { total: 4, free: 3 },
      fare: 25,
      concessionFare: 0
    }
  ];

  // Exact matching within +/- 5 minutes
  const exact = sampleTrips.filter(t => {
    const [h, m] = timeToMins(t.departs);
    return Math.abs(h * 60 + m - reqTotal) <= 5;
  });

  if (exact.length > 0) {
    return {
      exact,
      before: null,
      after: null,
      message: `Bus available at ${exact[0].departs} from ${from} to ${to}.`
    };
  }

  // Find nearest before and after
  let before: MockTrip | null = null;
  let after: MockTrip | null = null;

  for (const t of sampleTrips) {
    const [h, m] = timeToMins(t.departs);
    const mins = h * 60 + m;
    if (mins < reqTotal) {
      before = { ...t, minutesDifference: reqTotal - mins };
    } else if (mins > reqTotal && !after) {
      after = { ...t, minutesDifference: mins - reqTotal };
    }
  }

  const message = before && after
    ? `No bus at ${time}. Closest before is ${before.departs} (${before.minutesDifference} min earlier), closest after is ${after.departs} (${after.minutesDifference} min later).`
    : `Nearest scheduled accessible buses found around ${time}.`;

  return { exact: [], before, after, message };
}

function timeToMins(t: string): [number, number] {
  const parts = t.split(':').map(Number);
  return [parts[0] || 0, parts[1] || 0];
}

// In-memory mock storage for active bookings
export const MOCK_BOOKINGS: any[] = [
  {
    id: 'bkg_demo_asha',
    code: '8KG5QD',
    userId: 'usr_asha',
    tripId: 'trip_12_0842',
    fromStop: 'Esplanade',
    toStop: 'Salt Lake Sector V',
    seatId: 'bay_1',
    seatLabel: 'Wheelchair Bay 1',
    routeNumber: 'Line 12',
    departs: '08:42 AM',
    serviceDate: new Date().toISOString().split('T')[0],
    needs: ['visual'],
    guideDog: true,
    status: 'confirmed',
    timeline: [
      { step: 'booked', label: 'Trip Booked', done: true, time: 'Just now' },
      { step: 'conductor_notified', label: 'Conductor Notified', done: true, time: 'Just now' },
      { step: 'conductor_ack', label: 'Conductor Acknowledged', done: true, time: '1 min ago' },
      { step: 'bus_approaching', label: 'Bus Approaching (5 min away)', done: false },
      { step: 'boarding_ready', label: 'Boarding Assistance Ready', done: false },
      { step: 'completed', label: 'Journey Completed', done: false }
    ]
  }
];

export const MOCK_ALERTS: any[] = [
  {
    id: 'alt_demo_1',
    bookingId: 'bkg_demo_asha',
    stop: 'Esplanade',
    passenger: 'Asha Sharma',
    seat: 'Priority Seat 1',
    needs: ['Blind / Audio help', 'Guide Dog travelling'],
    status: 'sent',
    time: '08:42 AM'
  }
];
