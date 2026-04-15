"use client";

import { useRouter } from "next/navigation";

export type MemberOption = { id: string; name: string; email: string };

export function CoachMemberProgressSelect({
  members,
  selectedId,
}: {
  members: MemberOption[];
  selectedId: string;
}) {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-gymsanity-100 bg-white/90 p-5 shadow-sm">
      <label className="block text-sm font-medium text-gymsanity-900">
        Select member
        <select
          value={selectedId}
          onChange={(e) => {
            const id = e.target.value;
            router.replace(`/coach/member-progress?member=${encodeURIComponent(id)}`);
          }}
          className="mt-2 w-full max-w-xl rounded-xl border border-gymsanity-200 bg-white px-3 py-2.5 text-gymsanity-950 shadow-sm focus:border-gymsanity-400 focus:outline-none focus:ring-1 focus:ring-gymsanity-400"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} · {m.email}
            </option>
          ))}
        </select>
      </label>
      <p className="mt-2 text-xs text-gymsanity-700/80">
        Choose a member to view their progress report, onboarding summary, and nutrition notes.
      </p>
    </div>
  );
}
