"use client";

import { useState } from "react";

type Recent = {
  id: string;
  subject: string;
  sentAt: string;
  recipientCount: number;
};

export function CoachNewsletterForm({
  activeCount,
  configured,
  recent,
}: {
  activeCount: number;
  configured: boolean;
  recent: Recent[];
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/coach/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send.");
      return;
    }
    setMessage(`Sent to ${data.sent} subscriber${data.sent === 1 ? "" : "s"}.`);
    setSubject("");
    setBody("");
  }

  return (
    <div className="space-y-8">
      {!configured ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Email sending is not configured yet. Add <code className="font-semibold">RESEND_API_KEY</code> and a
          verified <code className="font-semibold">NEWSLETTER_FROM</code> address (for example{" "}
          <code>Gymsanity &lt;hello@gymsanity.fit&gt;</code>) on Vercel. Signups are still being saved (
          {activeCount} on the list).
        </p>
      ) : (
        <p className="text-sm text-gymsanity-800/85">
          {activeCount} subscriber{activeCount === 1 ? "" : "s"} will receive this note.
        </p>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-2xl border border-gymsanity-100 bg-white/90 p-6 shadow-sm">
        <label className="block text-sm font-medium text-gymsanity-900">
          Subject
          <input
            required
            minLength={3}
            maxLength={120}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
            placeholder="This week’s training note"
          />
        </label>
        <label className="block text-sm font-medium text-gymsanity-900">
          Message
          <textarea
            required
            minLength={20}
            maxLength={8000}
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gymsanity-200 px-3 py-2 text-gymsanity-950"
            placeholder="Blank line between paragraphs. Keep it short."
          />
        </label>
        {error ? <p className="text-sm text-red-800">{error}</p> : null}
        {message ? <p className="text-sm text-green-800">{message}</p> : null}
        <button
          type="submit"
          disabled={loading || !configured || activeCount === 0}
          className="rounded-full bg-gymsanity-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-800 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send to the list"}
        </button>
      </form>

      {recent.length > 0 ? (
        <div>
          <h2 className="font-display text-lg font-semibold text-gymsanity-950">Recently sent</h2>
          <ul className="mt-3 space-y-2 text-sm text-gymsanity-800">
            {recent.map((r) => (
              <li key={r.id} className="rounded-xl border border-gymsanity-100 bg-white/80 px-4 py-3">
                <span className="font-medium text-gymsanity-950">{r.subject}</span>
                <span className="mt-1 block text-xs text-gymsanity-600">
                  {new Date(r.sentAt).toLocaleString()} · {r.recipientCount} sent
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
