import { getSession } from "@/lib/get-session";

export async function requireCoach() {
  const session = await getSession();
  if (!session || session.role !== "COACH") return null;
  return session;
}
