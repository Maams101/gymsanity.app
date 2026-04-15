import { cookies } from "next/headers";
import { COOKIE, verifySession, type SessionPayload } from "@/lib/auth";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
