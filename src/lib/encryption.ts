// AES-256-GCM field-level encryption for sensitive text fields
// Format: "v1:<iv>:<tag>:<ct>" all base64

const KEY_STORAGE = 'dreamlog:encryption_key';

async function getOrCreateKey(): Promise<CryptoKey> {
  let keyB64 = localStorage.getItem(KEY_STORAGE);
  if (!keyB64) {
    const keyData = new Uint8Array(32);
    crypto.getRandomValues(keyData);
    keyB64 = btoa(String.fromCharCode(...keyData));
    localStorage.setItem(KEY_STORAGE, keyB64);
  }
  const raw = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptField(text: string | null | undefined): Promise<string | null> {
  if (!text || text.trim() === '') return null;
  try {
    const key = await getOrCreateKey();
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);
    const encoded = new TextEncoder().encode(text);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
    const ct = new Uint8Array(ciphertext);
    // Tag is last 16 bytes in WebCrypto AES-GCM
    const tag = ct.slice(ct.length - 16);
    const actualCt = ct.slice(0, ct.length - 16);
    return `v1:${btoa(String.fromCharCode(...iv))}:${btoa(String.fromCharCode(...tag))}:${btoa(String.fromCharCode(...actualCt))}`;
  } catch {
    return null;
  }
}

export async function decryptField(payload: string | null | undefined): Promise<string | null> {
  if (!payload || !payload.startsWith('v1:')) return payload || null;
  try {
    const parts = payload.split(':');
    if (parts.length !== 4) return null;
    const key = await getOrCreateKey();
    const iv = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
    const tag = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(parts[3]), c => c.charCodeAt(0));
    // Reconstruct: ciphertext + tag for WebCrypto
    const combined = new Uint8Array(ct.length + tag.length);
    combined.set(ct);
    combined.set(tag, ct.length);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined);
    return new TextDecoder().decode(decrypted);
  } catch {
    return null; // fail-closed
  }
}
