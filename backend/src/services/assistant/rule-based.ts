import { resolveStop } from '../search/nearest-time.js';

export interface AssistantResponse {
  intent: string;
  slots: {
    from?: string;
    to?: string;
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
 * Resilient rule-based fallback when Gemini API key is unset, times out, or is offline
 */
export function ruleBasedAssistantParse(
  text: string,
  language = 'en',
  currentState: any = {}
): AssistantResponse {
  const clean = text.toLowerCase().trim();

  // 1. Confirmation intents
  if (/^(yes|yeah|confirm|correct|ha|haan|sahi|thik|হাঁ|হ্যাঁ|ঠিক)/i.test(clean)) {
    return {
      intent: 'confirm',
      slots: {},
      reply_text: language === 'hi'
        ? 'धन्यवाद! आपकी बुकिंग की पुष्टि की जा रही है।'
        : language === 'bn'
        ? 'ধন্যবাদ! আপনার বুকিং নিশ্চিত করা হচ্ছে।'
        : 'Thank you! Confirming your bus booking now.',
      ui_action: 'CONFIRM_PENDING',
      needs_confirmation: false
    };
  }

  // 2. Deny / Cancel intents
  if (/^(no|cancel|stop|nah|nahi|na|naa|না|না না)/i.test(clean)) {
    return {
      intent: 'deny',
      slots: {},
      reply_text: language === 'hi'
        ? 'कोई बात नहीं, क्रिया रद्द कर दी गई है।'
        : language === 'bn'
        ? 'কোনো সমস্যা নেই, কাজটি বাতিল করা হয়েছে।'
        : 'Understood. Action has been cancelled. Where would you like to go?',
      ui_action: 'RESET_PENDING',
      needs_confirmation: false
    };
  }

  // 3. SOS intent
  if (/(help|sos|emergency|bachao|madad|मदद|एसओएस|সাহায্য)/i.test(clean)) {
    return {
      intent: 'sos',
      slots: {},
      reply_text: language === 'hi'
        ? 'आपातकालीन सहायता अलर्ट भेजा गया है। शांत रहें।'
        : language === 'bn'
        ? 'জরুরি সহায়তা পাঠানো হয়েছে। শান্ত থাকুন।'
        : 'Emergency SOS alert has been activated. Assistance is being dispatched.',
      ui_action: 'TRIGGER_SOS',
      needs_confirmation: false
    };
  }

  // 4. Time choice (before / earlier vs after / later)
  if (/(earlier|before|first|pehle|aage|আগের|প্রথম)/i.test(clean)) {
    return {
      intent: 'choose_option',
      slots: { choice: 'before' },
      reply_text: language === 'hi'
        ? 'पहले वाली बस चुन ली गई है।'
        : language === 'bn'
        ? 'আগের বাসটি নির্বাচন করা হয়েছে।'
        : 'Selected the earlier bus option. Would you like to confirm?',
      ui_action: 'SELECT_BEFORE_TRIP',
      needs_confirmation: true
    };
  }

  if (/(later|after|second|baad|pore|পরের|দ্বিতীয়)/i.test(clean)) {
    return {
      intent: 'choose_option',
      slots: { choice: 'after' },
      reply_text: language === 'hi'
        ? 'बाद वाली बस चुन ली गई है।'
        : language === 'bn'
        ? 'পরের বাসটি নির্বাচন করা হয়েছে।'
        : 'Selected the later bus option. Would you like to confirm?',
      ui_action: 'SELECT_AFTER_TRIP',
      needs_confirmation: true
    };
  }

  // 5. Trip planning extraction (from ... to ...)
  let from = currentState.slots?.from;
  let to = currentState.slots?.to;

  const toMatch = clean.match(/(?:to|ko|te|jate|পর্যন্ত)\s+([a-zA-Z\u0900-\u097F\u0980-\u09FF\s]+)/i);
  const fromMatch = clean.match(/(?:from|se|theke)\s+([a-zA-Z\u0900-\u097F\u0980-\u09FF\s]+)/i);

  if (toMatch) {
    const resolved = resolveStop(toMatch[1]);
    if (resolved) to = resolved.name;
  }
  if (fromMatch) {
    const resolved = resolveStop(fromMatch[1]);
    if (resolved) from = resolved.name;
  }

  // Check for common mentions directly
  if (!to) {
    if (clean.includes('salt lake') || clean.includes('সল্টলেক') || clean.includes('सॉल्ट लेक') || clean.includes('साल्ट लेक')) to = 'Salt Lake Sector V';
    else if (clean.includes('airport') || clean.includes('বিমানবন্দর') || clean.includes('हवाई अड्डा')) to = 'Airport Gate 1';
    else if (clean.includes('howrah') || clean.includes('হাওড়া') || clean.includes('हावड़ा')) to = 'Howrah Station';
  }
  if (!from) {
    if (clean.includes('esplanade') || clean.includes('এসপ্ল্যানেড') || clean.includes('एस्प्लेनेड')) from = 'Esplanade';
    else if (clean.includes('sealdah') || clean.includes('শিয়ালদহ') || clean.includes('सियालदह')) from = 'Sealdah';
  }

  // Time extraction
  const timeMatch = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|ta)?/i);
  let time = currentState.slots?.time || '09:00';
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const isPm = /pm/i.test(timeMatch[3] || '') || clean.includes('evening') || clean.includes('sham');
    if (isPm && hour < 12) hour += 12;
    time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const date = clean.includes('tomorrow') || clean.includes('kal') || clean.includes('আগামীকাল')
    ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
    : todayStr;

  if (from && to) {
    return {
      intent: 'plan_trip',
      slots: { from, to, date, time },
      reply_text: language === 'hi'
        ? `${from} से ${to} के लिए ${time} की बसें खोजी जा रही हैं।`
        : language === 'bn'
        ? `${from} থেকে ${to} এর জন্য ${time} এ বাস খোঁজা হচ্ছে।`
        : `Searching accessible buses from ${from} to ${to} around ${time}.`,
      ui_action: 'EXECUTE_SEARCH',
      needs_confirmation: false,
      suggestions: ['Check closest earlier bus', 'Check closest later bus']
    };
  }

  if (to && !from) {
    return {
      intent: 'plan_trip',
      slots: { to, date, time },
      reply_text: language === 'hi'
        ? `${to} जाने के लिए आप किस बस स्टॉप से चढ़ेंगे? जैसे कि एस्प्लेनेड या सियालदह।`
        : language === 'bn'
        ? `${to} যাওয়ার জন্য আপনি কোন স্টপ থেকে উঠবেন? যেমন এসপ্ল্যানেড বা শিয়ালদহ।`
        : `Heading to ${to}. Which stop will you board from, such as Esplanade or Sealdah?`,
      needs_confirmation: false
    };
  }

  // Default friendly fallback
  return {
    intent: 'help',
    slots: {},
    reply_text: language === 'hi'
      ? 'मैं साथी बस सहायक हूँ। आप कह सकते हैं: "कल सुबह 9 बजे साल्ट लेक के लिए बस खोजो"।'
      : language === 'bn'
      ? 'আমি সাথীবাস সহকারী। আপনি বলতে পারেন: "আগামীকাল সকাল ৯টায় সল্টলেকের বাস খুঁজুন"।'
      : 'I am SaathiBus assistant. You can say: "Find a bus to Salt Lake tomorrow at 9 AM". Where would you like to go?',
    needs_confirmation: false,
    suggestions: ['To Salt Lake at 9 AM', 'Bus to Airport', 'SOS Emergency']
  };
}
