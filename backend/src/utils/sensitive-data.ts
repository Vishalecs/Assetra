import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import env from '../config/env.js';

export const encryptSensitiveValue = (value: string) => {
  if (!value) return '';
  const key = createHash('sha256').update(env.JWT_SECRET).digest();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `enc:v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${encrypted.toString('base64')}`;
};