import { CoachNewsletterForm } from "@/components/coach/CoachNewsletterForm";
import { prisma } from "@/lib/db";
import { isNewsletterSendConfigured } from "@/lib/newsletter";

export default async function CoachNewsletterPage() {
  const [activeCount, recent] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    prisma.newsletterBroadcast.findMany({
      orderBy: { sentAt: "desc" },
      take: 8,
      select: { id: true, subject: true, sentAt: true, recipientCount: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gymsanity-700">Desk</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-gymsanity-950">Newsletter</h1>
        <p className="mt-2 max-w-xl text-gymsanity-900/75">
          Write one note. It goes to everyone who joins Gymsanity — whether or not they’ve purchased a plan.
        </p>
      </div>
      <CoachNewsletterForm
        activeCount={activeCount}
        configured={isNewsletterSendConfigured()}
        recent={recent.map((r) => ({
          id: r.id,
          subject: r.subject,
          sentAt: r.sentAt.toISOString(),
          recipientCount: r.recipientCount,
        }))}
      />
    </div>
  );
}
