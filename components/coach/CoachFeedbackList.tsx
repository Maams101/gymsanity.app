type FeedbackItem = {
  id: string;
  message: string;
  rating: number | null;
  createdAt: string;
  user: { name: string; email: string };
};

export function CoachFeedbackList({ feedback }: { feedback: FeedbackItem[] }) {
  if (feedback.length === 0) {
    return (
      <p className="rounded-2xl border border-gymsanity-100 bg-white/90 p-6 text-sm text-gymsanity-800/75">
        No focus-group feedback yet. Participants can submit notes from Settings → Focus group feedback.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {feedback.map((f) => (
        <li
          key={f.id}
          className="rounded-2xl border border-gymsanity-100 bg-white/90 p-5 shadow-sm shadow-gymsanity-900/5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-gymsanity-950">{f.user.name}</p>
              <p className="text-xs text-gymsanity-800/70">{f.user.email}</p>
            </div>
            <div className="text-right text-xs text-gymsanity-800/70">
              {f.rating != null ? (
                <p className="font-semibold text-gymsanity-700">{f.rating}/5</p>
              ) : null}
              <p>{new Date(f.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gymsanity-900/85">{f.message}</p>
        </li>
      ))}
    </ul>
  );
}
