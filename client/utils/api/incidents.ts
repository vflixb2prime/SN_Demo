import { IncidentSummaryResponse } from "@shared/api";

import type { IncidentSummaryResponse } from "@shared/api";

export async function fetchIncidentSummary(): Promise<IncidentSummaryResponse> {
  const res = await fetch("/api/incidents/summary");
  if (!res.ok)
    throw new Error(`Failed to fetch incident summary: ${res.status}`);
  return res.json();
}
