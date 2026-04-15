# Gymsanity product & design notes

## Design principles (elite web / brand fit)

1. **Sanity over hype** — UI stays calm (lavender gradients, breathing room, Fraunces for emotional headlines). Nothing shouts “PR smash.”
2. **Privacy-first stories** — Music playlists are **optional reflections**, not social feeds. No public likes by default; the value is *your* archive.
3. **Coach authority** — The exercise library + program builder treats you as the author: reusable blocks, clear prescriptions, publish when ready.
4. **Progressive disclosure** — Members see simple flows (Soundtrack → playlist → add song). Coaches see structured tools (library → program → session days).

## Soundtrack (music)

**What we shipped**

- Personal **playlists** with title, optional subtitle, optional chapter reflection.
- **Tracks** with title, artist, optional streaming link, optional note (“why this one”).
- **Spotify embed** when the URL is a Spotify track or playlist/album (opens in-page player for quick listening).

**Why not Spotify login (OAuth) yet**

- OAuth adds compliance, token storage, and scopes. **Links + embeds** give 80% of the “interactive music” feel with far less risk for a 20-person roster.
- **Next step** if you want it: “Connect Spotify” to pull favorites into a draft playlist (still keep your reflection fields).

## Exercise library & programs

**Library**

- Each **Exercise** has name, category, equipment, **coaching cues**, optional **video URL** (YouTube/Vimeo/Drive link opens in a new tab from member sessions).
- Cues surface on the **session** screen when a program line is linked to the library—members see *how* you want it executed, not just sets/reps.

**Programs (coach)**

- Create a **draft program**, add **session days** (week / day index / title / focus).
- Add **blocks** by picking from the library and writing the **prescription** for that context (e.g. same squat, different tempo or rep range).
- **Publish** toggles visibility for members (`published` on `Program`).

**What’s not in v1**

- Drag-and-drop reorder (use delete/re-add for now).
- Member-facing “goals questionnaire” auto-matching programs (future: tags on programs + member goal tags).

## Accountability streak (11 days → free 1:1)

- **Rule:** Members build a **consecutive-day streak** in **UTC**: at least **one program session marked complete** per day counts once toward the streak.
- **Reward:** At **11 consecutive days**, the member receives **+1** credit on their **1:1 balance** (same mechanism as other credits), with a ledger line for audit.
- **Gaps:** Missing a UTC day resets the streak to **1** on the next qualifying completion.
- **Multiple sessions same day:** Only the **first** new completion of that UTC day advances the streak; additional sessions the same day do not stack.

---

## Suggested roadmap

| Priority | Idea |
|----------|------|
| High | Goal tags on programs + member profile goals |
| High | Reorder tracks / lines (drag handles) |
| Medium | Spotify OAuth import |
| Medium | Apple Music / YouTube Music deep links + oEmbed |
| Low | Social opt-in: share one playlist publicly |

---

These choices keep the app **trustworthy**, **coach-led**, and **emotionally intelligent** without boiling the ocean.
