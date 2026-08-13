import { SignJWT, jwtVerify } from "jose";

/** Keep middleware Edge-safe: do not import @prisma/client here. */
export type SessionRole = "COACH" | "MEMBER";

const COOKIE = "gymsanity_session";
const alg = "HS256";

function getSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  sub: string;
  email: string;
  role: SessionRole;
};

export async function signSession(payload: SessionPayload, maxAgeSec = 60 * 60 * 24 * 14) {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSec}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [alg] });
    const sub = payload.sub;
    const email = payload.email as string | undefined;
    const role = payload.role as SessionRole | undefined;
    if (!sub || !email || (role !== "COACH" && role !== "MEMBER")) return null;
    return { sub, email, role };
  } catch {
    return null;
  }
}

export { COOKIE };
