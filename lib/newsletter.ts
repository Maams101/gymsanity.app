import { NewsletterSource } from "@prisma/client";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { appBaseUrl } from "@/lib/app-url";
import { prisma } from "@/lib/db";

export type NewsletterSubscribeInput = {
  email: string;
  name?: string | null;
  source: NewsletterSource;
  userId?: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newUnsubscribeToken(): string {
  return randomBytes(24).toString("hex");
}

export function isNewsletterSendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress(): string {
  return process.env.NEWSLETTER_FROM?.trim() || "Gymsanity <beth.t@example.com>";
}

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphsToHtml(body: string): string {
  return body
    .trim()
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function newsletterHtml(opts: { heading: string; bodyHtml: string; unsubscribeUrl: string }): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f0ff;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:24px auto;padding:32px 28px;background:#ffffff;border-radius:16px;border:1px solid #eee4ff;">
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#6d28d9;">Gymsanity</p>
    <h1 style="margin:0 0 20px;font-size:24px;color:#2e1065;">${escapeHtml(opts.heading)}</h1>
    ${opts.bodyHtml}
    <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">
      You’re getting this because you signed up for Gymsanity.
      <a href="${opts.unsubscribeUrl}" style="color:#6d28d9;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

function unsubscribeUrl(token: string): string {
  return `${appBaseUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

export async function upsertNewsletterSubscription(input: NewsletterSubscribeInput) {
  const email = normalizeEmail(input.email);
  const name = input.name?.trim() || null;
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });

  if (!existing) {
    const row = await prisma.newsletterSubscriber.create({
      data: {
        email,
        name,
        source: input.source,
        userId: input.userId ?? null,
        unsubscribeToken: newUnsubscribeToken(),
      },
    });
    await sendWelcomeEmail(row.id).catch((err) => {
      console.error("newsletter welcome failed", err);
    });
    return { subscriber: row, created: true, resubscribed: false };
  }

  const wasUnsubscribed = existing.unsubscribedAt != null;
  const row = await prisma.newsletterSubscriber.update({
    where: { id: existing.id },
    data: {
      name: name ?? existing.name,
      userId: input.userId ?? existing.userId,
      unsubscribedAt: null,
      source: existing.source === NewsletterSource.SIGNUP ? NewsletterSource.SIGNUP : input.source,
    },
  });

  if (wasUnsubscribed || !existing.welcomeSentAt) {
    await sendWelcomeEmail(row.id).catch((err) => {
      console.error("newsletter welcome failed", err);
    });
  }

  return { subscriber: row, created: false, resubscribed: wasUnsubscribed };
}

export async function unsubscribeByToken(token: string) {
  const clean = token.trim();
  if (!clean) return null;
  const row = await prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: clean } });
  if (!row) return null;
  if (row.unsubscribedAt) return row;
  return prisma.newsletterSubscriber.update({
    where: { id: row.id },
    data: { unsubscribedAt: new Date() },
  });
}

export async function setSubscriptionForUser(userId: string, subscribed: boolean) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) return null;

  if (subscribed) {
    const { subscriber } = await upsertNewsletterSubscription({
      email: user.email,
      name: user.name,
      source: NewsletterSource.SIGNUP,
      userId: user.id,
    });
    return subscriber;
  }

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: normalizeEmail(user.email) } });
  if (!existing) return null;
  if (existing.unsubscribedAt) return existing;
  return prisma.newsletterSubscriber.update({
    where: { id: existing.id },
    data: { unsubscribedAt: new Date() },
  });
}

export async function getSubscriptionForUser(userId: string, email: string) {
  return prisma.newsletterSubscriber.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, unsubscribedAt: true },
  });
}

async function sendWelcomeEmail(subscriberId: string) {
  const client = resendClient();
  if (!client) return;

  const row = await prisma.newsletterSubscriber.findUnique({ where: { id: subscriberId } });
  if (!row || row.unsubscribedAt || row.welcomeSentAt) return;

  const first = row.name?.split(/\s+/)[0] || "there";
  const html = newsletterHtml({
    heading: "You’re on the list",
    bodyHtml: paragraphsToHtml(
      `Hey ${first},\n\nWelcome to Gymsanity. You’ll get occasional training notes, recovery reminders, and studio updates — the same ideas we coach with, not a daily blast.\n\nTrain for sanity.`
    ),
    unsubscribeUrl: unsubscribeUrl(row.unsubscribeToken),
  });

  const { error } = await client.emails.send({
    from: fromAddress(),
    to: row.email,
    subject: "Welcome to the Gymsanity list",
    html,
  });
  if (error) {
    throw new Error(error.message);
  }

  await prisma.newsletterSubscriber.update({
    where: { id: row.id },
    data: { welcomeSentAt: new Date() },
  });
}

export async function sendNewsletterBroadcast(opts: {
  subject: string;
  body: string;
  coachUserId: string;
}): Promise<{ sent: number; skipped: number; configured: boolean }> {
  const client = resendClient();
  if (!client) {
    return { sent: 0, skipped: 0, configured: false };
  }

  const recipients = await prisma.newsletterSubscriber.findMany({
    where: { unsubscribedAt: null },
    select: { email: true, name: true, unsubscribeToken: true },
  });

  let sent = 0;
  for (const r of recipients) {
    const { error } = await client.emails.send({
      from: fromAddress(),
      to: r.email,
      subject: opts.subject,
      html: newsletterHtml({
        heading: opts.subject,
        bodyHtml: paragraphsToHtml(opts.body),
        unsubscribeUrl: unsubscribeUrl(r.unsubscribeToken),
      }),
    });
    if (error) {
      console.error("newsletter send failed", r.email, error);
      continue;
    }
    sent += 1;
  }

  await prisma.newsletterBroadcast.create({
    data: {
      subject: opts.subject,
      body: opts.body,
      recipientCount: sent,
      coachUserId: opts.coachUserId,
    },
  });

  return { sent, skipped: Math.max(0, recipients.length - sent), configured: true };
}
