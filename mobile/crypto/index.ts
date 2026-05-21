import * as ExpoCrypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 32;

export function generateSalt(): Uint8Array {
    return ExpoCrypto.getRandomBytes(16);
}

export function generateIV(): Uint8Array {
    return ExpoCrypto.getRandomBytes(12);
}

export async function deriveMasterKey(password: string, salt: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    const keyBytes = await pbkdf2Async(sha256, passwordBytes, salt, {
        c: PBKDF2_ITERATIONS,
        dkLen: KEY_LENGTH,
        asyncTick: 10,
    });

    return arrayBufferToHex(keyBytes);
}

export async function encryptData(data: string, key: string, iv: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const keyBytes = hexToBytes(key);
    const encrypted = gcm(keyBytes, iv).encrypt(dataBytes);

    return uint8ArrayToBase64(encrypted);
}

export async function decryptData(encryptedBase64: string, key: string, iv: Uint8Array): Promise<string> {
    const encryptedBytes = base64ToUint8Array(encryptedBase64);
    const keyBytes = hexToBytes(key);
    const decrypted = gcm(keyBytes, iv).decrypt(encryptedBytes);

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

export async function encryptVaultItem(
    item: unknown,
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

export async function decryptVaultItem(
    encryptedData: string,
    ivBase64: string,
    masterKey: string
): Promise<unknown> {
    const iv = base64ToUint8Array(ivBase64);
    const decrypted = await decryptData(encryptedData, masterKey, iv);
    return JSON.parse(decrypted);
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    if (typeof btoa !== 'undefined') {
        return btoa(binary);
    }

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
    if (typeof atob !== 'undefined') {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

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
    const buffer = array.buffer.slice(array.byteOffset, array.byteOffset + array.byteLength);
    return arrayBufferToBase64(buffer as ArrayBuffer);
}

export function base64ToUint8Array(base64: string): Uint8Array {
    return new Uint8Array(base64ToArrayBuffer(base64));
}

function arrayBufferToHex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

function hexToBytes(hex: string): Uint8Array {
    if (!/^[a-f0-9]{64}$/i.test(hex)) {
        throw new Error('Invalid key format');
    }

    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
}

export async function exportKey(key: string): Promise<{ k: string }> {
    return { k: key };
}

export async function importKey(jwk: { k: string }): Promise<string> {
    return jwk.k;
}
