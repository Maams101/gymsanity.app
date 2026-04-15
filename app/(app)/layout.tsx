import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import { getActiveMembership } from "@/lib/membership";
import { getMemberNavPreview } from "@/lib/member-nav-preview";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { role: true, onboardingCompletedAt: true },
  });
  if (user?.role === "MEMBER" && !user.onboardingCompletedAt) {
    redirect("/onboarding");
  }
  if (user?.role === "MEMBER" && user.onboardingCompletedAt) {
    const active = await getActiveMembership(session.sub);
    if (!active) {
      redirect("/subscribe");
    }
  }

  const memberNavPreview = await getMemberNavPreview(session.sub);
  return (
    <AppShell session={session} memberNavPreview={memberNavPreview}>
      {children}
    </AppShell>
  );
}
