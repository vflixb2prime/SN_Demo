/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Incident domain types
export type IncidentStatus = "open" | "resolved" | "on_hold";

export interface Incident {
  id: string;
  createdAt: string; // ISO string
  resolvedAt?: string | null; // ISO string if resolved
  status: IncidentStatus;
  assignedTo?: string | null;
}

export interface IncidentSummary {
  todayTotal: number;
  todayRaised: number;
  todayResolved: number;
  yesterdayRaised: number;
  yesterdayResolved: number;
  currentMonthTotal: number;
  currentMonthResolved: number;
  notAssigned: number;
  onHoldTotal: number;
}

export interface IncidentSummaryResponse {
  summary: IncidentSummary;
  generatedAt: string; // ISO date
}
