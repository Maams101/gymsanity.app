"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { NewProgramForm } from "@/components/coach/NewProgramForm";
import { TailoredProgramForm } from "@/components/coach/TailoredProgramForm";

type ProgramItem = {
  id: string;
  title: string;
  description: string;
  weeks: number;
  published: boolean;
  assignedMemberId: string | null;
  assignedMember: { id: string; name: string; email: string } | null;
  _count: { days: number };
};

type Member = { id: string; name: string; email: string };

type ScopeFilter = "all" | "library" | "tailored" | "drafts" | "live";
type CreateMode = "library" | "tailored";

const SCOPE_TABS: { id: ScopeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "library", label: "Library" },
  { id: "tailored", label: "1:1" },
  { id: "drafts", label: "Drafts" },
  { id: "live", label: "Live" },
];

function initialScope(searchParams: ReturnType<typeof useSearchParams>): ScopeFilter {
  const scope = searchParams.get("scope");
  if (scope === "tailored" || scope === "library" || scope === "drafts" || scope === "live") {
    return scope;
  }
  return "all";
}

export function ProgramsLibrary({
  programs: initialPrograms,
  members,
}: {
  programs: ProgramItem[];
  members: Member[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [programs, setPrograms] = useState(initialPrograms);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeFilter>(() => initialScope(searchParams));
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("library");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return programs.filter((p) => {
      if (scope === "library" && p.assignedMemberId) return false;
      if (scope === "tailored" && !p.assignedMemberId) return false;
      if (scope === "drafts" && p.published) return false;
      if (scope === "live" && !p.published) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.assignedMember?.name.toLowerCase().includes(q)
      );
    });
  }, [programs, query, scope]);

  const counts = useMemo(
    () => ({
      all: programs.length,
      library: programs.filter((p) => !p.assignedMemberId).length,
      tailored: programs.filter((p) => p.assignedMemberId).length,
      drafts: programs.filter((p) => !p.published).length,
      live: programs.filter((p) => p.published).length,
    }),
    [programs]
  );

  async function deleteProgram(p: ProgramItem) {
    const label = p.published ? "published program" : "draft";
    if (
      !confirm(
        `Delete this ${label} “${p.title}”? All sessions and exercise blocks will be removed. This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletingId(p.id);
    const res = await fetch(`/api/coach/programs/${p.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) return;
    setPrograms((prev) => prev.filter((x) => x.id !== p.id));
    router.refresh();
  }

  function selectScope(next: ScopeFilter) {
    setScope(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete("scope");
    else params.set("scope", next);
    const qs = params.toString();
    router.replace(qs ? `/coach/programs?${qs}` : "/coach/programs", { scroll: false });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gymsanity-900">
            Search programs
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, description, or member name…"
              className="mt-1 w-full max-w-md rounded-xl border border-gymsanity-200 bg-white px-3 py-2.5"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen((o) => !o)}
          className="shrink-0 rounded-full bg-gymsanity-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gymsanity-900"
        >
          {createOpen ? "Close" : "+ New program"}
        </button>
      </div>

      {createOpen && (
        <div className="rounded-2xl border border-gymsanity-200 bg-white/95 p-1 shadow-sm">
          <div className="flex gap-1 border-b border-gymsanity-100 p-1">
            <button
              type="button"
              onClick={() => setCreateMode("library")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                createMode === "library"
                  ? "bg-gymsanity-100 text-gymsanity-950"
                  : "text-gymsanity-700 hover:text-gymsanity-950"
              }`}
            >
              Library program
            </button>
            <button
              type="button"
              onClick={() => setCreateMode("tailored")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                createMode === "tailored"
                  ? "bg-violet-100 text-violet-950"
                  : "text-gymsanity-700 hover:text-gymsanity-950"
              }`}
            >
              1:1 program
            </button>
          </div>
          <div className="p-4">
            {createMode === "library" ? (
              <NewProgramForm />
            ) : (
              <TailoredProgramForm members={members} />
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {SCOPE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => selectScope(tab.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              scope === tab.id
                ? "bg-gymsanity-800 text-white"
                : "border border-gymsanity-200 bg-white text-gymsanity-800 hover:border-gymsanity-300"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-70">({counts[tab.id]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gymsanity-200 bg-gymsanity-50/50 px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold text-gymsanity-950">No programs match</p>
          <p className="mt-2 text-sm text-gymsanity-800">
            {programs.length === 0
              ? "Create your first program to build week-by-week sessions from your exercise library."
              : "Try a different filter or search term."}
          </p>
          {!createOpen && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 rounded-full bg-gymsanity-700 px-5 py-2 text-sm font-semibold text-white"
            >
              + New program
            </button>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <div className="group flex h-full flex-col rounded-2xl border border-gymsanity-100 bg-white/90 p-5 shadow-sm transition hover:border-gymsanity-300 hover:shadow-md">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      p.published
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {p.published ? "Live" : "Draft"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      p.assignedMember
                        ? "bg-violet-100 text-violet-900"
                        : "bg-gymsanity-100 text-gymsanity-800"
                    }`}
                  >
                    {p.assignedMember ? "1:1" : "Library"}
                  </span>
                </div>
                <Link href={`/coach/programs/${p.id}`} className="mt-3 block min-w-0">
                  <h3 className="font-display text-lg font-semibold text-gymsanity-950 group-hover:text-gymsanity-800">
                    {p.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-gymsanity-800/85">{p.description}</p>
                </Link>
                <div className="mt-4 flex flex-1 flex-wrap items-end justify-between gap-2 border-t border-gymsanity-50 pt-4 text-xs text-gymsanity-700">
                  <span>
                    {p.weeks} wk · {p._count.days} session{p._count.days === 1 ? "" : "s"}
                    {p.assignedMember ? (
                      <>
                        {" "}
                        · <span className="font-medium text-violet-800">{p.assignedMember.name}</span>
                      </>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/coach/programs/${p.id}`}
                      className="font-semibold text-gymsanity-800 hover:underline"
                    >
                      Edit →
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === p.id}
                      onClick={() => void deleteProgram(p)}
                      className="font-semibold text-red-700 hover:underline disabled:opacity-50"
                    >
                      {deletingId === p.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
