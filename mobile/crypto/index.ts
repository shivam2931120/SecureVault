import { Platform } from 'react-native';
import * as ExpoCrypto from 'expo-crypto';

// Configuration
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32; // 256 bits in bytes

/**
 * Generate a random salt
 */
export function generateSalt(): Uint8Array {
    return ExpoCrypto.getRandomBytes(16);
}

/**
 * Generate a random IV for AES-GCM
 */
export function generateIV(): Uint8Array {
    return ExpoCrypto.getRandomBytes(12);
}

/**
 * Simple key derivation using SHA-256 hash iterations
 * Note: This is a simplified PBKDF2-like implementation for Expo managed workflow
 * For production, consider using a native module or server-side key derivation
 */
export async function deriveMasterKey(password: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);

    // Combine password and salt
    const combined = new Uint8Array(passwordBytes.length + salt.length);
    combined.set(passwordBytes, 0);
    combined.set(salt, passwordBytes.length);

    // Hash multiple times to simulate PBKDF2
    let hash = await ExpoCrypto.digestStringAsync(
        ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        arrayBufferToHex(combined),
        { encoding: ExpoCrypto.CryptoEncoding.HEX }
    );

    // Additional iterations for security
    for (let i = 0; i < 1000; i++) {
        hash = await ExpoCrypto.digestStringAsync(
            ExpoCrypto.CryptoDigestAlgorithm.SHA256,
            hash + arrayBufferToHex(salt),
            { encoding: ExpoCrypto.CryptoEncoding.HEX }
        );
    }

    return hash;
}

/**
 * Simple XOR-based encryption for Expo managed workflow
 * Note: For production, use proper AES encryption via native module
 */
export async function encryptData(data: string, key: string, iv: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const keyBytes = hexToBytes(key);

    // XOR encryption with key stream derived from key + IV
    const encrypted = new Uint8Array(dataBytes.length);
    for (let i = 0; i < dataBytes.length; i++) {
        const keyIndex = i % keyBytes.length;
        const ivIndex = i % iv.length;
        encrypted[i] = dataBytes[i] ^ keyBytes[keyIndex] ^ iv[ivIndex];
    }

    return arrayBufferToBase64(encrypted.buffer as ArrayBuffer);
}

/**
 * Simple XOR-based decryption
 */
export async function decryptData(encryptedBase64: string, key: string, iv: Uint8Array): Promise<string> {
    const encryptedBytes = base64ToUint8Array(encryptedBase64);
    const keyBytes = hexToBytes(key);

    // XOR decryption (same as encryption due to XOR properties)
    const decrypted = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
        const keyIndex = i % keyBytes.length;
        const ivIndex = i % iv.length;
        decrypted[i] = encryptedBytes[i] ^ keyBytes[keyIndex] ^ iv[ivIndex];
    }

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Encrypt a vault item (object) for storage
 */
export async function encryptVaultItem(
    item: any,
    masterKey: string
): Promise<{ encryptedData: string; iv: string }> {
    const iv = generateIV();
    const jsonData = JSON.stringify(item);
    const encrypted = await encryptData(jsonData, masterKey, iv);

    return {
        encryptedData: encrypted,
        iv: uint8ArrayToBase64(iv),
    };
}

/**
 * Decrypt a vault item from storage
 */
export async function decryptVaultItem(
    encryptedData: string,
    ivBase64: string,
    masterKey: string
): Promise<any> {
    const iv = base64ToUint8Array(ivBase64);
    const decrypted = await decryptData(encryptedData, masterKey, iv);
    return JSON.parse(decrypted);
}

// Helper functions for Base64 conversion
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    // Use built-in btoa on web, manual encoding on native
    if (typeof btoa !== 'undefined') {
        return btoa(binary);
    }
    // Fallback for React Native
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < binary.length; i += 3) {
        const a = binary.charCodeAt(i);
        const b = binary.charCodeAt(i + 1) || 0;
        const c = binary.charCodeAt(i + 2) || 0;

        result += base64Chars[a >> 2];
        result += base64Chars[((a & 3) << 4) | (b >> 4)];
        result += (i + 1 < binary.length) ? base64Chars[((b & 15) << 2) | (c >> 6)] : '=';
        result += (i + 2 < binary.length) ? base64Chars[c & 63] : '=';
    }
    return result;
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    // Use built-in atob on web
    if (typeof atob !== 'undefined') {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Fallback for React Native
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const binary: number[] = [];
    let buffer = 0;
    let bits = 0;

    for (const char of base64) {
        if (char === '=') break;
        const value = base64Chars.indexOf(char);
        if (value === -1) continue;

        buffer = (buffer << 6) | value;
        bits += 6;

        if (bits >= 8) {
            bits -= 8;
            binary.push((buffer >> bits) & 0xFF);
        }
    }

    return new Uint8Array(binary).buffer;
}

export function uint8ArrayToBase64(array: Uint8Array): string {
    return arrayBufferToBase64(array.buffer as ArrayBuffer);
}

export function base64ToUint8Array(base64: string): Uint8Array {
    return new Uint8Array(base64ToArrayBuffer(base64));
}

function arrayBufferToHex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

// Export key as JSON string (for AsyncStorage)
export async function exportKey(key: string): Promise<{ k: string }> {
    return { k: key };
}

// Import key from JSON
export async function importKey(jwk: { k: string }): Promise<string> {
    return jwk.k;
}
