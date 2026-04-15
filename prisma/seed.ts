import {
  ExerciseLineSection,
  PlanBillingType,
  PrismaClient,
  SlotType,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { exerciseMuscleBySlug } from "./exercise-muscle-by-slug";
import { exerciseSeedCatalog } from "./exercise-seed-catalog";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("gymsanity123", 12);

  const coach = await prisma.user.upsert({
    where: { email: "coach@gymsanity.app" },
    update: {},
    create: {
      email: "coach@gymsanity.app",
      name: "Aliou Barry",
      role: UserRole.COACH,
      passwordHash: password,
    },
  });

  const demoOnboarding = {
    heightCm: 178,
    weightKg: 76,
    weightDisplayUnit: "kg" as const,
    measurementSystem: "metric" as const,
    ageYears: 34,
    trainingExperience: "intermediate",
    sessionsPerWeek: "3-4",
    equipmentAccess: ["full_gym", "home_db"],
    primaryGoals: ["strength", "routine", "general_health"],
    goalDetails: "Seed demo — stay consistent without burning out.",
    targetTimeline: "3mo",
    sleepHours: "7-8",
    stressLevel: "moderate",
    recoveryPractices: ["stretching", "walks", "breathwork"],
    healthConditions: "",
    medicationsSupplements: "",
    injuryLimitations: "",
    clearedByPhysician: "yes",
  };

  const member = await prisma.user.upsert({
    where: { email: "member@gymsanity.app" },
    update: {
      onboardingCompletedAt: new Date(),
      onboardingProfile: demoOnboarding,
    },
    create: {
      email: "member@gymsanity.app",
      name: "Demo Member",
      role: UserRole.MEMBER,
      passwordHash: password,
      onboardingCompletedAt: new Date(),
      onboardingProfile: demoOnboarding,
    },
  });

  const coachingSlugs = ["coaching-1", "coaching-6", "coaching-12", "coaching-24"] as const;
  const coachingRows = await prisma.plan.findMany({
    where: { slug: { in: [...coachingSlugs] } },
    select: { id: true },
  });
  if (coachingRows.length > 0) {
    await prisma.membership.deleteMany({
      where: { planId: { in: coachingRows.map((p) => p.id) } },
    });
    await prisma.plan.deleteMany({
      where: { id: { in: coachingRows.map((p) => p.id) } },
    });
  }

  const hybridRow = await prisma.plan.findUnique({ where: { slug: "hybrid" } });
  if (hybridRow) {
    await prisma.membership.deleteMany({ where: { planId: hybridRow.id } });
    await prisma.plan.delete({ where: { id: hybridRow.id } });
  }

  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { slug: "digital" },
      update: {
        stripePriceId: process.env.STRIPE_PRICE_DIGITAL || undefined,
        billingType: PlanBillingType.SUBSCRIPTION,
      },
      create: {
        slug: "digital",
        name: "Digital",
        description: "Full programming library + group sessions.",
        includesDigitalPrograms: true,
        allowsGroupBooking: true,
        allowsOneOnOneBooking: false,
        oneOnOneCreditsPerMonth: 0,
        sortOrder: 1,
        billingType: PlanBillingType.SUBSCRIPTION,
        stripePriceId: process.env.STRIPE_PRICE_DIGITAL || null,
      },
    }),
    prisma.plan.upsert({
      where: { slug: "elite" },
      update: {
        stripePriceId: process.env.STRIPE_PRICE_ELITE || undefined,
        billingType: PlanBillingType.SUBSCRIPTION,
      },
      create: {
        slug: "elite",
        name: "Elite 1:1",
        description: "Priority access + deeper coaching touchpoints.",
        includesDigitalPrograms: true,
        allowsGroupBooking: true,
        allowsOneOnOneBooking: true,
        oneOnOneCreditsPerMonth: 8,
        sortOrder: 2,
        billingType: PlanBillingType.SUBSCRIPTION,
        stripePriceId: process.env.STRIPE_PRICE_ELITE || null,
      },
    }),
  ]);

  const digital = plans.find((p) => p.slug === "digital")!;

  await prisma.membership.deleteMany({ where: { userId: member.id } });
  await prisma.membership.create({
    data: {
      userId: member.id,
      planId: digital.id,
      active: true,
    },
  });

  await prisma.membership.deleteMany({ where: { userId: coach.id } });
  await prisma.membership.create({
    data: {
      userId: coach.id,
      planId: digital.id,
      active: true,
    },
  });

  await prisma.creditBalance.upsert({
    where: { userId: coach.id },
    update: { balance: 0 },
    create: { userId: coach.id, balance: 0 },
  });

  await prisma.creditBalance.upsert({
    where: { userId: member.id },
    update: { balance: 0 },
    create: { userId: member.id, balance: 0 },
  });

  await prisma.creditLedger.deleteMany({ where: { userId: member.id } });

  const existing = await prisma.program.findFirst({ where: { title: "Sanity Base" } });
  if (existing) {
    await prisma.programDay.deleteMany({ where: { programId: existing.id } });
    await prisma.program.delete({ where: { id: existing.id } });
  }

  const missingMuscle = exerciseSeedCatalog.filter((e) => !exerciseMuscleBySlug[e.slug]);
  if (missingMuscle.length > 0) {
    throw new Error(
      `Seed: missing muscleGroup for slugs: ${missingMuscle.map((e) => e.slug).join(", ")}`,
    );
  }

  const exerciseIds: Record<string, string> = {};
  let exOrder = 0;
  for (const ex of exerciseSeedCatalog) {
    const muscleGroup = exerciseMuscleBySlug[ex.slug]!;
    const row = await prisma.exercise.upsert({
      where: { slug: ex.slug },
      update: {
        name: ex.name,
        category: ex.category,
        muscleGroup,
        equipment: ex.equipment,
        cues: ex.cues,
        published: true,
        sortOrder: exOrder,
      },
      create: {
        slug: ex.slug,
        name: ex.name,
        category: ex.category,
        muscleGroup,
        equipment: ex.equipment,
        cues: ex.cues,
        published: true,
        sortOrder: exOrder,
      },
    });
    exerciseIds[ex.slug] = row.id;
    exOrder += 1;
  }

  const program = await prisma.program.create({
    data: {
      title: "Sanity Base",
      description:
        "A four-week rhythm to rebuild consistency—breath, strength, and recovery. Train for balance, not burnout.",
      weeks: 4,
      published: true,
      sortOrder: 1,
    },
  });

  const days = [
    { week: 1, day: 1, title: "Week 1 · Day 1 — Anchor", focus: "Breathing + full-body primer" },
    { week: 1, day: 2, title: "Week 1 · Day 2 — Steady", focus: "Aerobic base + core integrity" },
    { week: 1, day: 3, title: "Week 1 · Day 3 — Restore", focus: "Mobility + nervous system downshift" },
    { week: 2, day: 1, title: "Week 2 · Day 1 — Build", focus: "Compound strength, controlled tempo" },
  ];

  const lineTemplate = [
    {
      slug: "box-breathing" as const,
      name: "Box breathing",
      prescription: "4 rounds: inhale 4s · hold 4s · exhale 4s · hold 4s",
      section: ExerciseLineSection.MOVEMENT_PREP,
      setCount: 4,
    },
    {
      slug: "goblet-squat" as const,
      name: "Goblet squat",
      prescription: "3 × 8–10 · controlled 3s down",
      section: ExerciseLineSection.STRENGTH,
      setCount: 3,
    },
    {
      slug: "half-kneeling-press" as const,
      name: "Half-kneeling press",
      prescription: "3 × 8 each arm · ribs down",
      section: ExerciseLineSection.STRENGTH,
      setCount: 3,
    },
    {
      slug: "farmer-carry" as const,
      name: "Carry (farmer or suitcase)",
      prescription: "3 × 40 steps · tall posture",
      section: ExerciseLineSection.STRENGTH,
      setCount: 3,
    },
  ];

  for (const d of days) {
    const day = await prisma.programDay.create({
      data: {
        programId: program.id,
        weekNumber: d.week,
        dayIndex: d.day,
        title: d.title,
        focusNote: d.focus,
      },
    });

    let order = 1;
    for (const line of lineTemplate) {
      await prisma.exerciseLine.create({
        data: {
          programDayId: day.id,
          sortOrder: order++,
          name: line.name,
          prescription: line.prescription,
          exerciseId: exerciseIds[line.slug],
          section: line.section,
          setCount: line.setCount,
        },
      });
    }
  }

  await prisma.slot.deleteMany({});

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(7, 0, 0, 0);
  const end = new Date(start);
  end.setHours(8, 0, 0, 0);

  const start2 = new Date(start);
  start2.setDate(start2.getDate() + 1);
  start2.setHours(12, 0, 0, 0);
  const end2 = new Date(start2);
  end2.setHours(12, 45, 0, 0);

  await prisma.slot.createMany({
    data: [
      {
        startAt: start,
        endAt: end,
        type: SlotType.GROUP,
        title: "Morning sanity circuit",
        capacity: 12,
        location: "Gymsanity Studio · NYC",
      },
      {
        startAt: start2,
        endAt: end2,
        type: SlotType.ONE_ON_ONE,
        title: "1:1 coaching",
        capacity: 1,
        location: "Gymsanity Studio · NYC",
      },
    ],
  });

  console.log("Seed OK — coach:", coach.email, "member:", member.email, "password: gymsanity123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
