import type { FitnessProvider } from "@prisma/client";

export type FitnessProviderMeta = {
  id: FitnessProvider;
  name: string;
  tagline: string;
  /** What we sync into Gymsanity today. */
  syncs: string[];
  /** Brand accent for cards. */
  accent: string;
  /** OAuth authorize URL template when env configured; null = bridge/instructions. */
  oauthEnvKey: string | null;
};

export const FITNESS_PROVIDERS: FitnessProviderMeta[] = [
  {
    id: "APPLE_HEALTH",
    name: "Apple Health",
    tagline: "Steps, sleep, and workouts from iPhone & Apple Watch",
    syncs: ["Sleep", "Steps", "Workouts"],
    accent: "from-rose-500/10 to-rose-600/5 border-rose-200",
    oauthEnvKey: null,
  },
  {
    id: "GOOGLE_FIT",
    name: "Google Fit",
    tagline: "Activity and wellness from Android & Wear OS",
    syncs: ["Sleep", "Steps", "Heart rate"],
    accent: "from-blue-500/10 to-blue-600/5 border-blue-200",
    oauthEnvKey: "GOOGLE_FIT_CLIENT_ID",
  },
  {
    id: "FITBIT",
    name: "Fitbit",
    tagline: "Sleep stages, steps, and recovery scores",
    syncs: ["Sleep", "Steps", "Resting HR"],
    accent: "from-teal-500/10 to-teal-600/5 border-teal-200",
    oauthEnvKey: "FITBIT_CLIENT_ID",
  },
  {
    id: "GARMIN",
    name: "Garmin",
    tagline: "Training load, sleep, and body battery",
    syncs: ["Sleep", "Steps", "Stress"],
    accent: "from-sky-500/10 to-sky-600/5 border-sky-200",
    oauthEnvKey: "GARMIN_CLIENT_ID",
  },
  {
    id: "WHOOP",
    name: "WHOOP",
    tagline: "Recovery, strain, and sleep performance",
    syncs: ["Sleep", "Recovery", "Strain"],
    accent: "from-neutral-500/10 to-neutral-600/5 border-neutral-300",
    oauthEnvKey: "WHOOP_CLIENT_ID",
  },
  {
    id: "OURA",
    name: "Oura",
    tagline: "Readiness, sleep, and activity rings",
    syncs: ["Sleep", "Readiness", "Activity"],
    accent: "from-indigo-500/10 to-indigo-600/5 border-indigo-200",
    oauthEnvKey: "OURA_CLIENT_ID",
  },
  {
    id: "STRAVA",
    name: "Strava",
    tagline: "Runs, rides, and cardio sessions",
    syncs: ["Workouts", "Distance", "HR"],
    accent: "from-orange-500/10 to-orange-600/5 border-orange-200",
    oauthEnvKey: "STRAVA_CLIENT_ID",
  },
];

export function fitnessProviderMeta(id: FitnessProvider): FitnessProviderMeta {
  return FITNESS_PROVIDERS.find((p) => p.id === id)!;
}

export type FitnessSnapshot = {
  syncedAt: string;
  sleepHours?: number;
  steps?: number;
  restingHeartRate?: number;
  recoveryScore?: number;
  source: FitnessProvider;
};

/** Demo / bridge sync — generates plausible daily metrics until OAuth is wired. */
export function demoSnapshotForProvider(provider: FitnessProvider): FitnessSnapshot {
  const base = {
    syncedAt: new Date().toISOString(),
    source: provider,
  };
  switch (provider) {
    case "WHOOP":
      return { ...base, sleepHours: 7.2, recoveryScore: 68, restingHeartRate: 58 };
    case "OURA":
      return { ...base, sleepHours: 7.8, recoveryScore: 82, steps: 6400 };
    case "APPLE_HEALTH":
      return { ...base, sleepHours: 7.5, steps: 8200, restingHeartRate: 62 };
    case "GARMIN":
      return { ...base, sleepHours: 7.1, steps: 9100, recoveryScore: 71 };
    case "FITBIT":
      return { ...base, sleepHours: 6.9, steps: 7800, restingHeartRate: 60 };
    case "GOOGLE_FIT":
      return { ...base, sleepHours: 7.0, steps: 7500 };
    case "STRAVA":
      return { ...base, steps: 5200 };
    default:
      return { ...base, sleepHours: 7.0, steps: 7000 };
  }
}
