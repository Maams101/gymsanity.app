import type { Prisma } from "@prisma/client";
import type { FitnessConnection, FitnessProvider } from "@prisma/client";
import { prisma } from "@/lib/db";
import { localDateKey, yesterdayDateKey } from "@/lib/local-date";
import {
  demoSnapshotForProvider,
  fitnessProviderMeta,
  type FitnessSnapshot,
} from "@/lib/fitness-providers";

export type FitnessConnectionView = {
  provider: FitnessProvider;
  status: FitnessConnection["status"];
  lastSyncAt: string | null;
  lastSnapshot: FitnessSnapshot | null;
};

export async function getMemberFitnessConnections(
  userId: string
): Promise<FitnessConnectionView[]> {
  try {
    const rows = await prisma.fitnessConnection.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((r) => ({
      provider: r.provider,
      status: r.status,
      lastSyncAt: r.lastSyncAt?.toISOString() ?? null,
      lastSnapshot: (r.lastSnapshot as FitnessSnapshot | null) ?? null,
    }));
  } catch (err) {
    console.error("getMemberFitnessConnections:", err);
    return [];
  }
}

export async function connectFitnessProvider(
  userId: string,
  provider: FitnessProvider
): Promise<FitnessConnectionView> {
  const snapshot = demoSnapshotForProvider(provider);
  const row = await prisma.fitnessConnection.upsert({
    where: { userId_provider: { userId, provider } },
    create: {
      userId,
      provider,
      status: "CONNECTED",
      externalUserId: `demo-${provider.toLowerCase()}`,
      accessToken: "demo-token",
      lastSyncAt: new Date(),
      lastSnapshot: snapshot as Prisma.InputJsonValue,
    },
    update: {
      status: "CONNECTED",
      lastSyncAt: new Date(),
      lastSnapshot: snapshot as Prisma.InputJsonValue,
    },
  });

  await applySnapshotToSleepJournal(userId, snapshot);

  return {
    provider: row.provider,
    status: row.status,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    lastSnapshot: snapshot,
  };
}

export async function disconnectFitnessProvider(
  userId: string,
  provider: FitnessProvider
): Promise<void> {
  await prisma.fitnessConnection.updateMany({
    where: { userId, provider },
    data: { status: "DISCONNECTED", accessToken: null, refreshToken: null },
  });
}

export async function syncFitnessProvider(
  userId: string,
  provider: FitnessProvider
): Promise<FitnessConnectionView> {
  const existing = await prisma.fitnessConnection.findUnique({
    where: { userId_provider: { userId, provider } },
  });
  if (!existing || existing.status !== "CONNECTED") {
    throw new Error("NOT_CONNECTED");
  }

  const snapshot = demoSnapshotForProvider(provider);
  const row = await prisma.fitnessConnection.update({
    where: { userId_provider: { userId, provider } },
    data: { lastSyncAt: new Date(), lastSnapshot: snapshot as Prisma.InputJsonValue },
  });

  await applySnapshotToSleepJournal(userId, snapshot);

  return {
    provider: row.provider,
    status: row.status,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    lastSnapshot: snapshot,
  };
}

async function applySnapshotToSleepJournal(userId: string, snapshot: FitnessSnapshot) {
  if (snapshot.sleepHours == null) return;
  const entryDate = yesterdayDateKey();
  const label = fitnessProviderMeta(snapshot.source).name;
  await prisma.sleepJournalEntry.upsert({
    where: { userId_entryDate: { userId, entryDate } },
    create: {
      userId,
      entryDate,
      hoursAsleep: snapshot.sleepHours,
      bedtimeRoutine: `Synced from ${label} on ${localDateKey()}.`,
      dreamsRecalled: "",
    },
    update: {
      hoursAsleep: snapshot.sleepHours,
    },
  });
}
