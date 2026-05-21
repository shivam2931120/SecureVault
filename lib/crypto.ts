/**
 * Crypto utilities for zero-knowledge encryption
 * Uses AES-256-GCM for encryption and PBKDF2 for key derivation
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const KEY_VERIFIER_CHALLENGE = 'securevault-key-verifier-v1';

/**
 * Generate a random salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Generate a random IV for AES-GCM
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Derive an encryption key from a master password using PBKDF2
 */
export async function deriveMasterKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encryptData(
  data: string,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  return crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    dataBuffer
  );
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decryptData(
  encryptedData: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Convert ArrayBuffer to Base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert Uint8Array to Base64
 */
export function uint8ArrayToBase64(array: Uint8Array): string {
  return arrayBufferToBase64(array.buffer as ArrayBuffer);
}

/**
 * Convert Base64 to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  return new Uint8Array(base64ToArrayBuffer(base64));
}

export async function createKeyVerifier(
  key: CryptoKey
): Promise<{ encryptedData: string; iv: string }> {
  const iv = generateIV();
  const encrypted = await encryptData(KEY_VERIFIER_CHALLENGE, key, iv);

  return {
    encryptedData: arrayBufferToBase64(encrypted),
    iv: uint8ArrayToBase64(iv),
  };
}

export async function verifyMasterKey(
  key: CryptoKey,
  verifier: { encryptedData: string; iv: string }
): Promise<boolean> {
  try {
    const decrypted = await decryptData(
      base64ToArrayBuffer(verifier.encryptedData),
      key,
      base64ToUint8Array(verifier.iv)
    );

    return decrypted === KEY_VERIFIER_CHALLENGE;
  } catch {
    return false;
  }
}

/**
 * Hash password for authentication (NOT for encryption)
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

function secureRandomInt(maxExclusive: number): number {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > 0xffffffff) {
    throw new Error('Invalid random range');
  }

  const randomValue = new Uint32Array(1);
  const range = 0x100000000;
  const limit = range - (range % maxExclusive);

  do {
    crypto.getRandomValues(randomValue);
  } while (randomValue[0] >= limit);

  return randomValue[0] % maxExclusive;
}

function pickRandomCharacter(charset: string): string {
  return charset[secureRandomInt(charset.length)];
}

/**
 * Generate a secure random password.
 * Ensures each selected character class appears at least once.
 */
export function generatePassword(
  length: number = 16,
  includeUppercase: boolean = true,
  includeLowercase: boolean = true,
  includeNumbers: boolean = true,
  includeSymbols: boolean = true
): string {
  const groups = [
    includeUppercase ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
    includeLowercase ? 'abcdefghijklmnopqrstuvwxyz' : '',
    includeNumbers ? '0123456789' : '',
    includeSymbols ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : '',
  ].filter(Boolean);

  if (groups.length === 0) {
    groups.push('abcdefghijklmnopqrstuvwxyz', '0123456789');
  }

  const passwordLength = Math.max(Math.floor(length), groups.length, 1);
  const charset = groups.join('');
  const characters: string[] = groups.map(pickRandomCharacter);

  while (characters.length < passwordLength) {
    characters.push(pickRandomCharacter(charset));
  }

  for (let index = characters.length - 1; index > 0; index--) {
    const swapIndex = secureRandomInt(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters.join('');
}

/**
 * Encrypt vault item for storage
 */
export async function encryptVaultItem(
  item: unknown,
  masterKey: CryptoKey
): Promise<{ encryptedData: string; iv: string }> {
  const iv = generateIV();
  const jsonData = JSON.stringify(item);
  const encrypted = await encryptData(jsonData, masterKey, iv);
  
  return {
    encryptedData: arrayBufferToBase64(encrypted),
    iv: uint8ArrayToBase64(iv),
  };
}

/**
 * Decrypt vault item from storage
 */
export async function decryptVaultItem(
  encryptedData: string,
  iv: string,
  masterKey: CryptoKey
): Promise<unknown> {
  const encryptedBuffer = base64ToArrayBuffer(encryptedData);
  const ivArray = base64ToUint8Array(iv);
  const decrypted = await decryptData(encryptedBuffer, masterKey, ivArray);
  
  return JSON.parse(decrypted);
}
