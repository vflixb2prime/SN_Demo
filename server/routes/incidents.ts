import { RequestHandler } from "express";
import { computeIncidentSummary } from "@shared/summary";
import { Incident, IncidentStatus, IncidentSummaryResponse } from "@shared/api";

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

const INCIDENT_CACHE = generateMockIncidents();

export const handleIncidentSummary: RequestHandler = (_req, res) => {
  const summary = computeIncidentSummary(INCIDENT_CACHE);
  const payload: IncidentSummaryResponse = {
    summary,
    generatedAt: new Date().toISOString(),
  };
  res.status(200).json(payload);
};
