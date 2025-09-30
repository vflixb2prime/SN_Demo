import { IncidentSummaryResponse } from "@shared/api";

import type { IncidentSummaryResponse as IncidentSummaryResponseType } from "@shared/api";

export async function fetchIncidentSummary(): Promise<IncidentSummaryResponseType> {
  const res = await fetch("/api/incidents/summary");
  if (!res.ok)
    throw new Error(`Failed to fetch incident summary: ${res.status}`);
  return res.json();
}
