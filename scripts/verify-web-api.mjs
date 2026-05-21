const { webcrypto } = await import('node:crypto');

const crypto = webcrypto;
const baseUrl = process.env.VERIFY_BASE_URL || 'http://localhost:3000';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function fromBase64(value) {
  return Uint8Array.from(Buffer.from(value, 'base64'));
}

async function deriveMasterKey(password, salt) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptString(value, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(value)
  );

  return { encryptedData: toBase64(encrypted), iv: toBase64(iv) };
}

async function decryptString(encryptedData, iv, key) {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    key,
    fromBase64(encryptedData)
  );

  return decoder.decode(decrypted);
}

async function request(routePath, options) {
  const response = await fetch(baseUrl + routePath, options);
  const data = await response.json().catch(() => null);
  return { response, data };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyHappyPath() {
  const email = 'verify-' + Date.now() + '@example.com';
  const password = 'CorrectHorseBatteryStaple!42';
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveMasterKey(password, salt);
  const verifier = await encryptString('securevault-key-verifier-v1', key);

  const registered = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      salt: toBase64(salt),
      verifierEncryptedData: verifier.encryptedData,
      verifierIv: verifier.iv,
    }),
  });

  assert(registered.response.status === 201, 'register failed: ' + JSON.stringify(registered.data));
  const userId = registered.data?.user?.id;
  assert(userId, 'register response did not include a user id');

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  assert(login.response.status === 200, 'login failed: ' + JSON.stringify(login.data));
  assert(login.data?.salt && login.data?.keyVerifier, 'login response did not include salt and key verifier');

  const itemPayload = {
    title: 'Runtime Test',
    itemType: 'password',
    username: 'demo',
    password: 'S3cret!456789',
    url: 'https://example.com',
    tags: ['runtime'],
  };
  const encryptedItem = await encryptString(JSON.stringify(itemPayload), key);
  const created = await request('/api/vault', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      userId,
      itemType: 'password',
      encryptedData: encryptedItem.encryptedData,
      iv: encryptedItem.iv,
    }),
  });

  assert(created.response.status === 201, 'create item failed: ' + JSON.stringify(created.data));
  const itemId = created.data?.item?.id;
  assert(itemId, 'create response did not include an item id');

  const listed = await request('/api/vault?userId=' + encodeURIComponent(userId));
  assert(listed.response.status === 200, 'list items failed: ' + JSON.stringify(listed.data));
  assert(listed.data?.items?.length === 1, 'expected one item, got ' + listed.data?.items?.length);

  const decrypted = JSON.parse(await decryptString(
    listed.data.items[0].encryptedData,
    listed.data.items[0].iv,
    key
  ));
  assert(decrypted.title === itemPayload.title, 'decrypted item did not match original payload');

  const updatedPayload = { ...itemPayload, title: 'Runtime Test Updated' };
  const updatedEncrypted = await encryptString(JSON.stringify(updatedPayload), key);
  const updated = await request('/api/vault/' + itemId, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      userId,
      encryptedData: updatedEncrypted.encryptedData,
      iv: updatedEncrypted.iv,
    }),
  });
  assert(updated.response.status === 200, 'update item failed: ' + JSON.stringify(updated.data));

  const deleted = await request('/api/vault/' + itemId + '?userId=' + encodeURIComponent(userId), {
    method: 'DELETE',
  });
  assert(deleted.response.status === 200, 'delete item failed: ' + JSON.stringify(deleted.data));

  const deletedAccount = await request('/api/auth/account?userId=' + encodeURIComponent(userId), {
    method: 'DELETE',
  });
  assert(deletedAccount.response.status === 200, 'delete account failed: ' + JSON.stringify(deletedAccount.data));
}

async function verifyMissingUser() {
  const userId = 'missing-user-' + Date.now();
  const invalidCreate = await request('/api/vault', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      userId,
      itemType: 'password',
      encryptedData: toBase64(Buffer.from('x')),
      iv: toBase64(Buffer.alloc(12)),
    }),
  });
  assert(invalidCreate.response.status === 404, 'missing user create expected 404, got ' + invalidCreate.response.status);

  const invalidList = await request('/api/vault?userId=' + encodeURIComponent(userId));
  assert(invalidList.response.status === 404, 'missing user list expected 404, got ' + invalidList.response.status);
}

await verifyHappyPath();
await verifyMissingUser();
console.log('SecureVault API verification passed against ' + baseUrl);
