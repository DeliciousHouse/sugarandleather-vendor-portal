import type { SessionUser } from "./access-control";

export const SESSION_COOKIE_NAME = "slvp_session";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

type SessionPayload = SessionUser & {
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function encodeJson(value: unknown): string {
  return base64UrlEncode(encoder.encode(JSON.stringify(value)));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(decoder.decode(base64UrlDecode(value))) as T;
}

async function signingKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await signingKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
}

async function verify(payload: string, signature: string, secret: string): Promise<boolean> {
  const key = await signingKey(secret);
  return crypto.subtle.verify("HMAC", key, base64UrlDecode(signature), encoder.encode(payload));
}

export async function createSessionToken(
  user: SessionUser,
  secret: string,
  maxAgeSeconds = 60 * 60 * 24
): Promise<string> {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const encodedPayload = encodeJson(payload);
  const signature = await sign(encodedPayload, secret);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(
  token: string | null | undefined,
  secret: string
): Promise<SessionUser | null> {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  try {
    const valid = await verify(encodedPayload, signature, secret);
    if (!valid) return null;

    const payload = decodeJson<SessionPayload>(encodedPayload);
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: payload.id,
      role: payload.role,
      status: payload.status,
      partnerId: payload.partnerId,
    };
  } catch {
    return null;
  }
}
