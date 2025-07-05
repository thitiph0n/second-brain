// Cryptographic utilities for authentication

export function generateRandomId(): string {
  return crypto.randomUUID();
}

export function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyToken(token: string, hash: string): Promise<boolean> {
  const tokenHash = await hashToken(token);
  return tokenHash === hash;
}

export async function generateJWT(payload: object, secret: string, expiresIn: number = 3600): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const message = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[=]/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${message}.${signatureB64}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const message = `${headerB64}.${payloadB64}`;

  // Verify signature
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const isValid = await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(message));

  if (!isValid) {
    throw new Error('Invalid JWT signature');
  }

  // Parse and validate payload
  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('JWT token expired');
  }

  return payload;
}