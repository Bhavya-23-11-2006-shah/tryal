import jwt from 'jsonwebtoken';
import { getDb } from '../../db/index.js';
import { config } from '../../lib/config.js';
import { AppError } from '../../lib/errors.js';
import { decryptText } from '../../lib/crypto.js';

export interface UserSession {
  id: string;
  phone: string;
  name: string;
  role: 'passenger' | 'caregiver' | 'conductor' | 'depot';
  language: string;
  profile: any;
}

// In-memory OTP storage with TTL (5 minutes)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export function requestOtp(phone: string): { success: boolean; message: string; demoCode?: string } {
  if (!phone || phone.length < 10) {
    throw new AppError('Valid 10-digit mobile number required.', 400, 'INVALID_PHONE');
  }

  const code = config.DEMO_MODE ? config.DEMO_OTP : Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  return {
    success: true,
    message: 'OTP sent to mobile number',
    demoCode: config.DEMO_MODE ? code : undefined
  };
}

export function verifyOtp(phone: string, code: string): { token: string; user: UserSession } {
  const record = otpStore.get(phone);
  const isValidDemo = config.DEMO_MODE && code === config.DEMO_OTP;

  if (!isValidDemo && (!record || record.code !== code || Date.now() > record.expiresAt)) {
    throw new AppError('Invalid or expired OTP. Use demo code 123456.', 401, 'INVALID_OTP');
  }

  // Clear OTP once used
  otpStore.delete(phone);

  const db = getDb();
  let user = db.prepare('SELECT id, phone, name, role, language, profile FROM users WHERE phone = ?').get(phone) as any;

  if (!user) {
    // Register new user on the fly if not existing
    const newId = `usr_${Date.now()}`;
    const defaultProfile = { blind: false, deaf: false, wheelchair: false, cognitive: false };
    db.prepare('INSERT INTO users (id, phone, name, role, language, profile, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      newId,
      phone,
      'Commuter',
      'passenger',
      'en',
      JSON.stringify(defaultProfile),
      Date.now()
    );
    user = { id: newId, phone, name: 'Commuter', role: 'passenger', language: 'en', profile: JSON.stringify(defaultProfile) };
  }

  const userSession: UserSession = {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    language: user.language || 'en',
    profile: typeof user.profile === 'string' ? JSON.parse(user.profile) : user.profile
  };

  const token = jwt.sign(userSession, config.JWT_SECRET, { expiresIn: '7d' });
  return { token, user: userSession };
}

export function verifyJwtToken(token: string): UserSession {
  try {
    return jwt.verify(token, config.JWT_SECRET) as UserSession;
  } catch {
    throw new AppError('Authentication failed or session expired.', 401, 'UNAUTHORIZED');
  }
}
