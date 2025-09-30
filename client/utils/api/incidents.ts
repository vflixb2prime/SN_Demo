import type { IncidentSummaryResponse as IncidentSummaryResponseType } from "@shared/api";
import {
  buildServiceNowUrl,
  computeSummaryFromResponse,
  generateSummaryPayload,
  getStoredServiceNowConfig,
  type ServiceNowApiResponse,
} from "@/utils/servicenow";

export class MissingServiceNowConfigError extends Error {
  constructor() {
    super("ServiceNow API configuration is missing.");
    this.name = "MissingServiceNowConfigError";
  }
}

export async function fetchIncidentSummary(): Promise<IncidentSummaryResponseType> {
  if (typeof window === "undefined") {
    throw new Error("ServiceNow summary can only be fetched in the browser.");
  }

  const config = getStoredServiceNowConfig();

  if (!config) {
    throw new MissingServiceNowConfigError();
  }

  const url = buildServiceNowUrl(config);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token.trim()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  const payload = (await response.json()) as ServiceNowApiResponse;
  const incidents = computeSummaryFromResponse(payload);
  return generateSummaryPayload(incidents);
}
