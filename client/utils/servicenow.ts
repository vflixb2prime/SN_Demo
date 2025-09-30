import type { Incident, IncidentSummaryResponse } from "@shared/api";
import { computeIncidentSummary } from "@shared/summary";
import { parse } from "date-fns";

export const SERVICE_NOW_STORAGE_KEY = "servicenow-api-config";

export type ServiceNowConfig = {
  baseUrl: string;
  token: string;
  defaultQuery?: string;
};

export type ServiceNowApiRecord = {
  sys_id: string;
  opened_at?: string | null;
  resolved_at?: string | null;
  assigned_to?: string | null;
  state?: string | null;
};

export type ServiceNowApiResponse = {
  result?: {
    status?: string;
    data?: ServiceNowApiRecord[];
  };
};

const DATE_FORMAT = "yyyy-MM-dd HH:mm:ss";

function parseDateString(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = parse(trimmed, DATE_FORMAT, new Date());
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  } catch (error) {
    console.error("Failed to parse ServiceNow date", { value, error });
    return null;
  }
}

function mapStateToStatus(state?: string | null): Incident["status"] {
  const normalized = state?.toLowerCase() ?? "";
  if (normalized.includes("resolved")) return "resolved";
  if (normalized.includes("hold")) return "on_hold";
  return "open";
}

export function mapRecordToIncident(record: ServiceNowApiRecord): Incident {
  const openedIso = parseDateString(record.opened_at) ?? new Date().toISOString();
  const resolvedIso = parseDateString(record.resolved_at);
  return {
    id: record.sys_id,
    createdAt: openedIso,
    resolvedAt: resolvedIso,
    status: mapStateToStatus(record.state),
    assignedTo: record.assigned_to ? record.assigned_to.trim() || null : null,
  };
}

export function getStoredServiceNowConfig(): ServiceNowConfig | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SERVICE_NOW_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceNowConfig;
    if (!parsed.baseUrl || !parsed.token) return null;
    return parsed;
  } catch (error) {
    console.error("Failed to parse ServiceNow config", error);
    return null;
  }
}

export function buildServiceNowUrl(
  config: ServiceNowConfig,
  query?: string,
): string {
  const base = config.baseUrl.trim();
  const queryString = (query ?? config.defaultQuery ?? "").trim();
  if (!queryString) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}${queryString}`;
}

export function computeSummaryFromResponse(
  response: ServiceNowApiResponse,
): Incident[] {
  const records = response.result?.data ?? [];
  return records.map(mapRecordToIncident);
}

export function generateSummaryPayload(
  incidents: Incident[],
): IncidentSummaryResponse {
  const summary = computeIncidentSummary(incidents);
  return {
    summary,
    generatedAt: new Date().toISOString(),
  };
}
