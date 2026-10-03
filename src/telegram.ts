import crypto from 'crypto';

export interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
}

export function verifyTelegramAuth(initDataRaw: string, botToken: string): boolean {
  if (!initDataRaw || !botToken) return false;
  
  const params = new URLSearchParams(initDataRaw);
  const hash = params.get('hash');
  if (!hash) return false;

  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return calculatedHash === hash;
}
