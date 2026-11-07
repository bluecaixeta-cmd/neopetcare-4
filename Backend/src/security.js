import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual
} from 'node:crypto';

import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export function cleanText(value, maxLength = 500) {
  return typeof value === 'string'
    ? value.trim().slice(0, maxLength)
    : '';
}

export function validEmail(value) {
  return (
    typeof value === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
    value.length <= 254
  );
}

export async function createPasswordHash(password) {
  const salt = randomBytes(16).toString('hex');

  const derivedKey = await scrypt(
    password,
    salt,
    64
  );

  return `${salt}:${Buffer.from(derivedKey).toString('hex')}`;
}

export async function passwordMatches(password, savedHash) {
  const [salt, expectedHex] =
    String(savedHash).split(':');

  if (!salt || !expectedHex) {
    return false;
  }

  const derivedKey = Buffer.from(
    await scrypt(password, salt, 64)
  );

  const expectedKey = Buffer.from(
    expectedHex,
    'hex'
  );

  return (
    expectedKey.length === derivedKey.length &&
    timingSafeEqual(expectedKey, derivedKey)
  );
}

export function createSessionToken() {
  return randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

export function publicUser(user) {
  return user
    ? {
        id: user.id,
        name: user.name,
        email: user.email
      }
    : null;
}