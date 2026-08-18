import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isNewsletterSendConfigured, sendNewsletterBroadcast } from "@/lib/newsletter";
import { requireCoach } from "@/lib/require-coach";

const schema = z.object({
  subject: z.string().trim().min(3).max(120),
  body: z.string().trim().min(20).max(8000),
});

export async function POST(request: Request) {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isNewsletterSendConfigured()) {
    return NextResponse.json(
      { error: "Add RESEND_API_KEY (and NEWSLETTER_FROM) to send email." },
      { status: 503 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Subject needs 3+ characters and the note needs 20+." },
      { status: 400 }
    );
  }

  const result = await sendNewsletterBroadcast({
    subject: parsed.data.subject,
    body: parsed.data.body,
    coachUserId: session.sub,
  });

  return NextResponse.json({ ok: true, ...result });
}

export async function GET() {
  const session = await requireCoach();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [active, recent] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { unsubscribedAt: null } }),
    prisma.newsletterBroadcast.findMany({
      orderBy: { sentAt: "desc" },
      take: 8,
      select: { id: true, subject: true, sentAt: true, recipientCount: true },
    }),
  ]);

  return NextResponse.json({
    active,
    configured: isNewsletterSendConfigured(),
    recent,
  });
}
