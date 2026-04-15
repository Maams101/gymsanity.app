/** Evidence-informed sleep hygiene & recovery copy for the member sleep journal (educational, not medical advice). */

export type SleepAdviceSection = {
  title: string;
  summary: string;
  bullets: string[];
};

export const sleepAdviceIntro =
  "Sleep is the foundation of training adaptation, mood, and focus. These principles come from sleep medicine and chronobiology—use them to experiment gently and find what fits your life.";

export const sleepAdviceSections: SleepAdviceSection[] = [
  {
    title: "Consistency beats perfection",
    summary: "Your brain loves predictable timing more than an occasional long lie-in.",
    bullets: [
      "Wake up within the same 30–60 minute window most days—even after a short night. This stabilizes your circadian rhythm.",
      "A fixed wind-down cue (dim lights, calm audio or silence, light stretch) tells your nervous system sleep is coming.",
      "If you miss sleep, a short nap (15–25 minutes, or a full 90-minute cycle) beats sleeping in for hours and shifting your rhythm.",
    ],
  },
  {
    title: "Light, caffeine, and screens",
    summary: "What you do in the 2–3 hours before bed changes sleep depth more than most supplements.",
    bullets: [
      "Bright light and blue-rich screens delay melatonin. Dim warm light after sunset when you can; night modes help a little, distance and brightness matter more.",
      "Cut caffeine at least 8–10 hours before bed if you’re sensitive; half-life varies a lot between people.",
      "Alcohol fragments REM and deep sleep—one drink can look like “I fell asleep fast” while quality drops.",
    ],
  },
  {
    title: "Temperature & environment",
    summary: "Core body temperature needs to drop slightly for deep sleep.",
    bullets: [
      "A cool room (often cited around 65–68°F / 18–20°C) supports sleep onset; adjust to what feels calm, not cold-stressed.",
      "A warm bath or shower 1–2 hours before bed can help heat dissipate afterward and promote drowsiness.",
      "Dark, quiet space—or reliable earplugs and eye mask—reduces micro-arousals you won’t remember in the morning.",
    ],
  },
  {
    title: "Stress, rumination, and “busy brain”",
    summary: "Hyperarousal is one of the biggest modern sleep stealers.",
    bullets: [
      "Write a 2-minute “brain dump” or tomorrow list before bed so your mind isn’t holding open loops.",
      "Slow breathing (e.g. longer exhale than inhale) downshifts the sympathetic nervous system without forcing sleep.",
      "If you’re awake ~20+ minutes, leave the bed for a quiet, low-light activity and return when sleepy—classic stimulus control.",
    ],
  },
  {
    title: "Training & recovery",
    summary: "How you move during the day changes how you sleep at night.",
    bullets: [
      "Regular movement deepens slow-wave sleep for many people; very hard late-night sessions can delay sleep for some—experiment with timing.",
      "Heavy meals and intense digestion close to bed can raise core temperature; lighter evening fuel often feels better.",
      "Track patterns: if poor sleep clusters with certain stressors or workouts, you’ve got data to adjust load or schedule.",
    ],
  },
];
