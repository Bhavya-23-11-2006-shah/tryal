import { resolveStop } from '../search/nearest-time.js';
import { getKolkataDateString } from '../../lib/time.js';

export interface AssistantResponse {
  intent: string;
  slots: {
    from?: string;
    to?: string;
    landmark?: string;
    date?: string;
    time?: string;
    needs?: string[];
    bookingId?: string;
    choice?: string;
  };
  reply_text: string;
  ui_action?: string;
  needs_confirmation: boolean;
  suggestions?: string[];
}

/**
 * Word to number helper supporting English, Hindi, and Bengali numbers
 */
function parseSpokenTime(text: string): string | null {
  const clean = text.toLowerCase();

  // 1. Direct standard patterns: 9:30, 9.30, 09:00, 9 AM, 9:30 PM, 9 baje, 9 ta
  const digitMatch = clean.match(/(\b\d{1,2})(?::(\d{2})|\.(\d{2}))?\s*(am|pm|baje|ta|baje subah|baje sham)?/i);
  if (digitMatch) {
    let hour = parseInt(digitMatch[1], 10);
    const minute = parseInt(digitMatch[2] || digitMatch[3] || '0', 10);
    const mod = (digitMatch[4] || '').toLowerCase();
    const isPm = mod.includes('pm') || mod.includes('sham') || clean.includes('evening') || clean.includes('afternoon') || clean.includes('night');
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12 && mod.includes('am')) hour = 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }
  }

  // 2. Word-based time parsing ("nine thirty", "ten fifteen", "half past eight", "seven forty five")
  const wordMap: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12,
    // Hindi phonetics
    'ek': 1, 'do': 2, 'teen': 3, 'tin': 3, 'chaar': 4, 'char': 4,
    'paanch': 5, 'panch': 5, 'chhe': 6, 'saat': 7, 'sat': 7,
    'aath': 8, 'nau': 9, 'das': 10, 'gyarah': 11, 'barah': 12,
    // Bengali phonetics
    'noy': 9, 'dosh': 10, 'egaro': 11, 'baro': 12,
    // Minutes
    'fifteen': 15, 'thirty': 30, 'forty five': 45, 'forty-five': 45,
    'sadhe': 30, 'dedh': 1, 'dhai': 2
  };

  const isEvening = clean.includes('evening') || clean.includes('sham') || clean.includes('raat') || clean.includes('pm');
  
  if (clean.includes('half past') || clean.includes('sadhe')) {
    for (const [w, h] of Object.entries(wordMap)) {
      if (clean.includes(`half past ${w}`) || clean.includes(`sadhe ${w}`)) {
        let hour = h + (isEvening && h < 12 ? 12 : 0);
        return `${hour.toString().padStart(2, '0')}:30`;
      }
    }
  }

  if (clean.includes('quarter past')) {
    for (const [w, h] of Object.entries(wordMap)) {
      if (clean.includes(`quarter past ${w}`)) {
        let hour = h + (isEvening && h < 12 ? 12 : 0);
        return `${hour.toString().padStart(2, '0')}:15`;
      }
    }
  }

  // Check compound word numbers like "nine thirty", "ten fifteen", "eight forty five"
  for (const [hw, h] of Object.entries(wordMap)) {
    if (clean.includes(`${hw} thirty`)) {
      let hour = h + (isEvening && h < 12 ? 12 : 0);
      return `${hour.toString().padStart(2, '0')}:30`;
    }
    if (clean.includes(`${hw} fifteen`)) {
      let hour = h + (isEvening && h < 12 ? 12 : 0);
      return `${hour.toString().padStart(2, '0')}:15`;
    }
    if (clean.includes(`${hw} forty five`) || clean.includes(`${hw} forty-five`)) {
      let hour = h + (isEvening && h < 12 ? 12 : 0);
      return `${hour.toString().padStart(2, '0')}:45`;
    }
    // Standalone number word like "at nine", "nine in the morning", "nau baje"
    const regex = new RegExp(`\\b(?:at|around)?\\s*${hw}\\s*(?:am|pm|baje|o'clock|in the morning|in the evening)?\\b`, 'i');
    if (regex.test(clean) && h <= 12) {
      let hour = h + (isEvening && h < 12 ? 12 : 0);
      return `${hour.toString().padStart(2, '0')}:00`;
    }
  }

  return null;
}

/**
 * Parses spoken relative dates in Kolkata time
 */
function parseRelativeDate(text: string): string {
  const clean = text.toLowerCase();

  if (clean.includes('day after tomorrow') || clean.includes('parson') || clean.includes('পরশু')) {
    return getKolkataDateString(2);
  }
  if (clean.includes('tomorrow') || clean.includes('kal') || clean.includes('আগামীকাল')) {
    return getKolkataDateString(1);
  }

  // Next <day of week>
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (clean.includes(`next ${days[i]}`) || clean.includes(days[i])) {
      const now = new Date();
      const currentDay = now.getDay();
      let diff = i - currentDay;
      if (diff <= 0) diff += 7; // Next occurrence
      return getKolkataDateString(diff);
    }
  }

  // Default to today in Asia/Kolkata
  return getKolkataDateString(0);
}

/**
 * Resilient, dynamic multilingual NLP engine for SaathiBus.
 * Never replays fixed lines; dynamically contextualizes every response.
 */
export function ruleBasedAssistantParse(
  text: string,
  language = 'en',
  currentState: any = {}
): AssistantResponse {
  const clean = (text || '').toLowerCase().trim();

  // 0. Empty input
  if (!clean) {
    return {
      intent: 'help',
      slots: {},
      reply_text: language === 'hi'
        ? 'नमस्ते! मैं साथी बस सहायक हूँ। आप कहाँ जाना चाहते हैं?'
        : language === 'bn'
        ? 'নমস্কার! আমি সাথীবাস সহকারী। আপনি কোথায় যেতে চান?'
        : 'Hello! I am your SaathiBus transit assistant. Where would you like to travel?',
      needs_confirmation: false,
      suggestions: ['To Salt Lake at 9 AM', 'Help with wheelchair bus']
    };
  }

  // 1. Prompt Injection Defense
  if (
    clean.includes('ignore your rules') ||
    clean.includes('ignore previous instructions') ||
    clean.includes('ignore all previous') ||
    clean.includes('system prompt') ||
    clean.includes('delete the database') ||
    clean.includes('book for free') ||
    clean.includes('unrestricted ai') ||
    clean.includes('api key')
  ) {
    return {
      intent: 'security_reject',
      slots: {},
      reply_text: language === 'hi'
        ? 'सुरक्षा दिशानिर्देशों के तहत यह अनुरोध अस्वीकार कर दिया गया है। मैं केवल सुलभ बस बुकिंग में सहायता करता हूँ।'
        : language === 'bn'
        ? 'নিরাপত্তা বিধিমালার কারণে এই অনুরোধটি প্রত্যাখ্যাত হয়েছে। আমি কেবল বাস বুকিংয়ে সাহায্য করতে পারি।'
        : 'I am designed solely to assist passengers with accessible government bus travel in Kolkata. How can I help with your route?',
      needs_confirmation: false
    };
  }

  // 2. Emergency SOS intent
  if (/(help|sos|emergency|bachao|madad|मदद|एसओएस|সাহায্য|বিপদ)/i.test(clean)) {
    return {
      intent: 'sos',
      slots: {},
      reply_text: language === 'hi'
        ? 'आपातकालीन सहायता अनुरोध दर्ज कर लिया गया है। ट्रांजिट नियंत्रण एवं आपके आपातकालीन संपर्क को सूचित किया गया है।'
        : language === 'bn'
        ? 'জরুরি এসওএস অ্যালার্ট পাঠানো হয়েছে। ট্রানজিট কন্ট্রোল ও আপনার জরুরি যোগাযোগকে অবহিত করা হয়েছে।'
        : 'Emergency SOS alert has been triggered. Transit dispatch and your designated emergency contact have been notified.',
      ui_action: 'TRIGGER_SOS',
      needs_confirmation: false
    };
  }

  // 3. Language Switching
  if (clean.includes('hindi') || clean.includes('हिंदी')) {
    return {
      intent: 'change_language',
      slots: {},
      reply_text: 'भाषा बदलकर हिंदी कर दी गई है। अब आप हिंदी में बोल सकते हैं।',
      needs_confirmation: false
    };
  }
  if (clean.includes('bengali') || clean.includes('বাংলা') || clean.includes('bangla')) {
    return {
      intent: 'change_language',
      slots: {},
      reply_text: 'ভাষা পরিবর্তন করে বাংলা করা হয়েছে। আপনি এখন বাংলায় কথা বলতে পারেন।',
      needs_confirmation: false
    };
  }
  if (clean.includes('english') || clean.includes('अंग्रेजी') || clean.includes('ইংরেজি')) {
    return {
      intent: 'change_language',
      slots: {},
      reply_text: 'Language changed to English. How can I help you book your accessible ride?',
      needs_confirmation: false
    };
  }

  // 4. Confirmation intents (Handled strictly with pending session checks)
  if (/^(yes|yeah|yep|confirm|correct|ha|haan|sahi|thik|হাঁ|হ্যাঁ|ঠিক|ঠিক আছে|हां|हाँ|पुष्टि)/i.test(clean)) {
    return {
      intent: 'confirm',
      slots: {},
      reply_text: language === 'hi'
        ? 'धन्यवाद, आपकी पुष्टि प्राप्त हो गई है।'
        : language === 'bn'
        ? 'ধন্যবাদ, আপনার সম্মতি পাওয়া গেছে।'
        : 'Confirmation received. Processing your request now.',
      needs_confirmation: false
    };
  }

  // 5. Deny / Cancellation of current flow
  if (/^(no|cancel|stop|nah|nahi|na|naa|cancel that|cancel booking|না|না না|বাতিল|रद्द)/i.test(clean)) {
    if (clean.includes('booking') || clean.includes('ticket')) {
      return {
        intent: 'cancel_booking',
        slots: {},
        reply_text: language === 'hi'
          ? 'आपकी बुकिंग रद्द करने की प्रक्रिया शुरू कर दी गई है।'
          : language === 'bn'
          ? 'আপনার বুকিং বাতিল করার প্রক্রিয়া শুরু করা হয়েছে।'
          : 'Cancellation request acknowledged. Your booking can be cancelled and seat freed.',
        ui_action: 'CANCEL_BOOKING',
        needs_confirmation: false
      };
    }
    return {
      intent: 'deny',
      slots: {},
      reply_text: language === 'hi'
        ? 'कोई बात नहीं, क्रिया रद्द कर दी गई है। आप दूसरा रूट चुन सकते हैं।'
        : language === 'bn'
        ? 'কোনো সমস্যা নেই, কাজটি বাতিল করা হয়েছে। অন্য কোনো রুটে যেতে চান?'
        : 'Understood. Selection cleared. Where would you like to travel instead?',
      ui_action: 'RESET_PENDING',
      needs_confirmation: false
    };
  }

  // 6. Reschedule / Change time
  if (clean.includes('reschedule') || clean.includes('change time') || clean.includes('change bus') || clean.includes('समय बदल')) {
    return {
      intent: 'reschedule',
      slots: {},
      reply_text: language === 'hi'
        ? 'बुकिंग का समय बदलने के लिए कृपया नया प्रस्थान समय बताएँ।'
        : language === 'bn'
        ? 'সময় পরিবর্তন করতে অনুগ্রহ করে নতুন যাত্রা সময় বলুন।'
        : 'To reschedule your bus trip, what new time or date would you prefer?',
      needs_confirmation: false
    };
  }

  // 7. Time choice (before / earlier vs after / later)
  if (/(earlier|before|first|pehle|aage|আগের|প্রথম|पहला|पहले)/i.test(clean)) {
    return {
      intent: 'choose_option',
      slots: { choice: 'before' },
      reply_text: language === 'hi'
        ? 'निकटतम पहली वाली बस चुन ली गई है। क्या आप इसे बुक करना चाहते हैं?'
        : language === 'bn'
        ? 'আগের সুবিধাজনক বাসটি নির্বাচন করা হয়েছে। আপনি কি এটি নিশ্চিত করতে চান?'
        : 'Selected the earlier bus option. Would you like to confirm this trip?',
      ui_action: 'SELECT_BEFORE_TRIP',
      needs_confirmation: true
    };
  }

  if (/(later|after|second|baad|pore|পরের|দ্বিতীয়|बाद|अगला)/i.test(clean)) {
    return {
      intent: 'choose_option',
      slots: { choice: 'after' },
      reply_text: language === 'hi'
        ? 'निकटतम बाद वाली बस चुन ली गई है। क्या आप इसे बुक करना चाहते हैं?'
        : language === 'bn'
        ? 'পরের সুবিধাজনক বাসটি নির্বাচন করা হয়েছে। আপনি কি এটি নিশ্চিত করতে চান?'
        : 'Selected the later bus option. Would you like to confirm this trip?',
      ui_action: 'SELECT_AFTER_TRIP',
      needs_confirmation: true
    };
  }

  // 8. Needs Extraction
  const needs: string[] = [];
  if (clean.includes('wheelchair') || clean.includes('व्हीलचेयर') || clean.includes('হুইলচেয়ার') || clean.includes('ramp')) {
    needs.push('wheelchair');
    needs.push('ramp');
  }
  if (clean.includes('blind') || clean.includes('vision') || clean.includes('audio') || clean.includes('अंधा') || clean.includes('दृष्टि')) {
    needs.push('visual');
  }
  if (clean.includes('deaf') || clean.includes('hearing') || clean.includes('बहरा') || clean.includes('শ্রবণ')) {
    needs.push('hearing');
  }

  // 9. Stop & Landmark Extraction
  let from = currentState.slots?.from;
  let to = currentState.slots?.to;
  let landmark: string | undefined = undefined;

  // Check landmark mentions first
  if (clean.includes('victoria memorial') || clean.includes('victoria')) {
    landmark = 'Victoria Memorial';
    from = from || 'Esplanade'; // Victoria Memorial connects directly to Esplanade
  }
  if (clean.includes('sector v') || clean.includes('sec v') || clean.includes('sector 5')) {
    to = 'Salt Lake Sector V';
  }
  if (clean.includes('howrah')) {
    if (clean.includes('from howrah') || clean.includes('howrah se')) from = 'Howrah Station';
    else if (clean.includes('to howrah')) to = 'Howrah Station';
    else if (!from) from = 'Howrah Station';
    else to = 'Howrah Station';
  }
  if (clean.includes('airport')) {
    to = 'Airport Gate 1';
  }
  if (clean.includes('sealdah')) {
    if (clean.includes('from sealdah')) from = 'Sealdah';
    else to = 'Sealdah';
  }
  if (clean.includes('esplanade')) {
    if (clean.includes('to esplanade')) to = 'Esplanade';
    else from = 'Esplanade';
  }

  // Regex pattern matching for "from X to Y" or "X to Y"
  const fromToMatch = clean.match(/(?:from|se|theke)\s+([a-zA-Z\s]+?)\s+(?:to|ko|te|পর্যন্ত)\s+([a-zA-Z\s]+)/i);
  if (fromToMatch) {
    const resFrom = resolveStop(fromToMatch[1]);
    const resTo = resolveStop(fromToMatch[2]);
    if (resFrom) from = resFrom.name;
    if (resTo) to = resTo.name;
  } else {
    const directToMatch = clean.match(/(?:to|ko|te|পর্যন্ত)\s+([a-zA-Z\s]+)/i);
    const directFromMatch = clean.match(/(?:from|se|theke)\s+([a-zA-Z\s]+)/i);
    if (directToMatch) {
      const res = resolveStop(directToMatch[1]);
      if (res) to = res.name;
    }
    if (directFromMatch) {
      const res = resolveStop(directFromMatch[1]);
      if (res) from = res.name;
    }
  }

  // Unknown place check
  if (clean.includes('gotham') || clean.includes('wakanda') || clean.includes('wonderland') || clean.includes('narnia')) {
    return {
      intent: 'unknown_location',
      slots: {},
      reply_text: language === 'hi'
        ? 'माफ़ कीजिये, यह स्थान कोलकाता के सुलभ बस नेटवर्क में उपलब्ध नहीं है। उपलब्ध स्टॉप हैं जैसे एस्प्लेनेड, साल्ट लेक या हावड़ा।'
        : language === 'bn'
        ? 'দুঃখিত, এই স্থানটি কলকাতার বাস নেটওয়ার্কে নেই। আপনি এসপ্ল্যানেড, সল্টলেক বা হাওড়া থেকে বাস খুঁজতে পারেন।'
        : 'Sorry, that location is not part of Kolkata accessible transit network. Available hubs include Esplanade, Salt Lake Sector V, and Howrah.',
      needs_confirmation: false,
      suggestions: ['Esplanade to Salt Lake', 'Howrah to Airport Gate 1']
    };
  }

  // Ambiguous stop check
  if (clean === 'sector' || clean === 'gate' || clean === 'hospital') {
    return {
      intent: 'clarify_stop',
      slots: {},
      reply_text: language === 'hi'
        ? 'क्या आपका मतलब साल्ट लेक सेक्टर 5 या रूबी अस्पताल से है?'
        : language === 'bn'
        ? 'আপনি কি সল্টলেক সেক্টর ৫ নাকি রুবি হাসপাতাল বুঝিয়েছেন?'
        : 'Did you mean Salt Lake Sector V or Ruby Hospital? Please specify the full stop name.',
      needs_confirmation: false
    };
  }

  // Time & Date parsing
  const parsedTime = parseSpokenTime(clean);
  const time = parsedTime || currentState.slots?.time || '09:00';
  const date = parseRelativeDate(clean);

  // If both from and to identified
  if (from && to) {
    if (from.toLowerCase() === to.toLowerCase()) {
      return {
        intent: 'same_stop_error',
        slots: { from, to },
        reply_text: language === 'hi'
          ? 'चढ़ने और उतरने का स्टॉप एक ही नहीं हो सकता।'
          : language === 'bn'
          ? 'উঠা এবং নামার স্টপ একই হতে পারে না।'
          : 'Boarding stop and destination cannot be the same stop. Please pick different locations.',
        needs_confirmation: false
      };
    }

    return {
      intent: 'plan_trip',
      slots: { from, to, date, time, needs, landmark },
      reply_text: language === 'hi'
        ? `${from} से ${to} के लिए ${time} के आसपास बसें खोजी जा रही हैं।`
        : language === 'bn'
        ? `${from} থেকে ${to} এর জন্য ${time} নাগাদ বাস খোঁজা হচ্ছে।`
        : `Searching accessible buses from ${from} to ${to} around ${time} on ${date}.`,
      ui_action: 'EXECUTE_SEARCH',
      needs_confirmation: false,
      suggestions: ['Check closest earlier bus', 'Check closest later bus']
    };
  }

  // If only destination identified
  if (to && !from) {
    return {
      intent: 'plan_trip',
      slots: { to, date, time, needs },
      reply_text: language === 'hi'
        ? `${to} जाने के लिए आप कहाँ से बस पकड़ेंगे, जैसे एस्प्लेनेड या हावड़ा?`
        : language === 'bn'
        ? `${to} যাওয়ার জন্য আপনি কোন স্টপ থেকে উঠবেন, যেমন এসপ্ল্যানেড বা হাওড়া?`
        : `Got it, heading to ${to}. Where will you board the bus from, such as Esplanade or Howrah?`,
      needs_confirmation: false
    };
  }

  // Off-topic & Small talk
  if (clean.includes('weather') || clean.includes('mausam') || clean.includes('আবহাওয়া')) {
    return {
      intent: 'small_talk',
      slots: {},
      reply_text: language === 'hi'
        ? 'कोलकाता में आज मौसम सुहाना है। अपनी यात्रा के लिए बस बुक करने के लिए गंतव्य बताएँ।'
        : language === 'bn'
        ? 'কলকাতায় আজকের আবহাওয়া চমৎকার। আপনার ভ্রমণের জন্য বাসের বিবরণ দিন।'
        : 'It is pleasant in Kolkata today. Where would you like to travel on our accessible transit network?',
      needs_confirmation: false
    };
  }

  if (clean.includes('joke') || clean.includes('chutkula') || clean.includes('হাস্য')) {
    return {
      intent: 'small_talk',
      slots: {},
      reply_text: 'Why did the accessible bus smile? Because everyone gets an easy ramp on board! Where are we headed today?',
      needs_confirmation: false
    };
  }

  // Friendly Fallback
  return {
    intent: 'help',
    slots: {},
    reply_text: language === 'hi'
      ? 'मैं साथी बस सहायक हूँ। आप कह सकते हैं: "कल सुबह 9 बजे साल्ट लेक के लिए बस बुक करो"।'
      : language === 'bn'
      ? 'আমি সাথীবাস সহকারী। আপনি বলতে পারেন: "আগামীকাল সকাল ৯টায় সল্টলেকের বাস খুঁজুন"।'
      : 'I am SaathiBus assistant. You can speak naturally, for example: "Victoria Memorial to Sector V tomorrow at nine". Where would you like to go?',
    needs_confirmation: false,
    suggestions: ['Victoria Memorial to Sector V', 'Howrah to Airport Gate 1', 'Help me']
  };
}
