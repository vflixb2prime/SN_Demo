import { RequestHandler } from "express";
import {
  Incident,
  IncidentStatus,
  IncidentSummary,
  IncidentSummaryResponse,
} from "@shared/api";

// Deterministic pseudo-random generator
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function generateMockIncidents(daysBack = 120, seed = 123456): Incident[] {
  const rand = mulberry32(seed);
  const now = new Date();
  const incidents: Incident[] = [];
  let idCounter = 1;
  const assignees = ["alice", "bob", "carol", "dave", null];

  for (let i = daysBack; i >= 0; i--) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);

    // Create 20-60 incidents per day
    const dailyCount = 20 + Math.floor(rand() * 40);

    for (let j = 0; j < dailyCount; j++) {
      const createdAt = new Date(day);
      createdAt.setHours(
        Math.floor(rand() * 24),
        Math.floor(rand() * 60),
        0,
        0,
      );

      const statusRoll = rand();
      let status: IncidentStatus = "open";
      if (statusRoll < 0.6)
        status = "open"; // 60% open
      else if (statusRoll < 0.85)
        status = "resolved"; // 25% same-day resolved
      else status = "on_hold"; // 15%

      let resolvedAt: string | null = null;
      if (status === "resolved") {
        const resolveDelayDays = Math.floor(rand() * 3); // resolve in 0-2 days
        const resolvedDate = new Date(createdAt);
        resolvedDate.setDate(resolvedDate.getDate() + resolveDelayDays);
        resolvedDate.setHours(
          createdAt.getHours() + Math.floor(rand() * 6),
          Math.floor(rand() * 60),
          0,
          0,
        );
        if (resolvedDate <= now) {
          resolvedAt = resolvedDate.toISOString();
        } else {
          // If resolution falls in the future, keep as open
          status = "open";
          resolvedAt = null;
        }
      }

      const assigned = pick(rand, assignees);

      incidents.push({
        id: `INC${String(idCounter++).padStart(6, "0")}`,
        createdAt: createdAt.toISOString(),
        resolvedAt,
        status,
        assignedTo: assigned,
      });
    }
  }

  return incidents;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d: Date) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function computeSummary(
  incidents: Incident[],
  now = new Date(),
): IncidentSummary {
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const monthStart = startOfMonth(now);

  let todayTotal = 0;
  let todayRaised = 0;
  let todayResolved = 0;
  let yesterdayRaised = 0;
  let yesterdayResolved = 0;
  let currentMonthTotal = 0;
  let currentMonthResolved = 0;
  let notAssigned = 0;
  let onHoldTotal = 0;

  for (const inc of incidents) {
    const created = new Date(inc.createdAt);
    const resolved = inc.resolvedAt ? new Date(inc.resolvedAt) : null;

    if (created >= todayStart) {
      todayTotal++;
      todayRaised++;
    }
    if (resolved && isSameDay(resolved, now)) todayResolved++;

    if (created >= yesterdayStart && created < todayStart) {
      yesterdayRaised++;
    }
    if (resolved && resolved >= yesterdayStart && resolved < todayStart) {
      yesterdayResolved++;
    }

    if (created >= monthStart) {
      currentMonthTotal++;
    }
    if (resolved && resolved >= monthStart) {
      currentMonthResolved++;
    }

    if (!inc.assignedTo) notAssigned++;
    if (inc.status === "on_hold") onHoldTotal++;
  }

  return {
    todayTotal,
    todayRaised,
    todayResolved,
    yesterdayRaised,
    yesterdayResolved,
    currentMonthTotal,
    currentMonthResolved,
    notAssigned,
    onHoldTotal,
  };
}

const INCIDENT_CACHE = generateMockIncidents();

export const handleIncidentSummary: RequestHandler = (_req, res) => {
  const summary = computeSummary(INCIDENT_CACHE);
  const payload: IncidentSummaryResponse = {
    summary,
    generatedAt: new Date().toISOString(),
  };
  res.status(200).json(payload);
};
