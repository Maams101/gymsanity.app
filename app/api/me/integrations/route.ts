import type { FitnessProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  connectFitnessProvider,
  disconnectFitnessProvider,
  getMemberFitnessConnections,
  syncFitnessProvider,
} from "@/lib/fitness-connections";
import { getSession } from "@/lib/get-session";

const connectSchema = z.object({
  provider: z.enum([
    "APPLE_HEALTH",
    "GOOGLE_FIT",
    "FITBIT",
    "GARMIN",
    "WHOOP",
    "OURA",
    "STRAVA",
  ]),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "MEMBER") {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }
  const connections = await getMemberFitnessConnections(session.sub);
  return NextResponse.json({ connections });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "MEMBER") {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = connectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
  }

  const connection = await connectFitnessProvider(
    session.sub,
    parsed.data.provider as FitnessProvider
  );
  return NextResponse.json({ connection });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "MEMBER") {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  if (!provider || !connectSchema.shape.provider.safeParse(provider).success) {
    return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
  }

  await disconnectFitnessProvider(session.sub, provider as FitnessProvider);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "MEMBER") {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }

  const json = await request.json().catch(() => null);
  const parsed = connectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
  }

  try {
    const connection = await syncFitnessProvider(
      session.sub,
      parsed.data.provider as FitnessProvider
    );
    return NextResponse.json({ connection });
  } catch {
    return NextResponse.json({ error: "Connect the device first." }, { status: 400 });
  }
}
