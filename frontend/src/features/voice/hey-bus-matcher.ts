/**
 * High-accuracy wake-word matcher for "Hey Bus"
 * Tolerates speech-to-text phonetic variations across English, Hindi, and Bengali accents.
 */

const POSITIVE_PATTERNS = [
  // Standard English variants
  /\b(?:hey|hay|hei|he|hi|hello|ok|okay|aye|ay|ae|oye|ei)\s+(?:bus|buzz|bass|boss|baz|pass|baas|bas|bose|bhuss|bath|bat|pus)\b/i,
  // Compound single words sometimes produced by speech recognition
  /\b(?:heybus|haybus|hibus|okbus|ayebus)\b/i,
  // Hindi & Bengali phonetic transliterations and scripts
  /(?:हे\s*बस|अरे\s*बस|सुनो\s*बस|এই\s*বাস|হে\s*বাস|শোনো\s*বাস)/i,
  /\b(?:shono|suno)\s+(?:bus|bas)\b/i
];

const NEGATIVE_EXCLUSIONS = [
  /\b(?:buy\s+a\s+bus|school\s+bus|red\s+bus|the\s+bus\s+is|where\s+is\s+the\s+bus|bus\s+stop)\b/i,
  /\b(?:take\s+the|metro|call\s+a\s+cab|good\s+morning|hello\s+world|play\s+music)\b/i,
  /\b(?:is\s+this\s+bus|conductor|goodbye|thank\s+you|book\s+a\s+flight)\b/i
];

/**
 * Returns true if the spoken text triggers the "Hey Bus" assistant wake event
 */
export function matchHeyBus(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  // Normalize punctuation to spaces for robust acoustic matching
  const clean = text.toLowerCase().replace(/[,.!?\-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length < 3) return false;

  // Check if matched by any wake pattern
  const matchesWake = POSITIVE_PATTERNS.some((pattern) => pattern.test(clean));
  if (!matchesWake) return false;

  // Check if it is a false-positive sentence where "bus" was used in a descriptive non-wake context
  // e.g. "is this bus accessible" or "where is the bus"
  const isExcluded = NEGATIVE_EXCLUSIONS.some((neg) => neg.test(clean));
  if (isExcluded) return false;

  return true;
}
