import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/get-session";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "COACH") redirect("/today");
  return <AppShell session={session} variant="coach">{children}</AppShell>;
}
