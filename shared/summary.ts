import { Incident, IncidentSummary } from "./api";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date) {
  const instance = new Date(date);
  instance.setHours(0, 0, 0, 0);
  return instance;
}

function startOfMonth(date: Date) {
  const instance = new Date(date);
  instance.setDate(1);
  instance.setHours(0, 0, 0, 0);
  return instance;
}

export function computeIncidentSummary(
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
  const resolvedByCounts: Record<string, number> = {};

  for (const incident of incidents) {
    const created = new Date(incident.createdAt);
    const resolved = incident.resolvedAt ? new Date(incident.resolvedAt) : null;

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

    if (!incident.assignedTo) notAssigned++;
    if (incident.status === "on_hold") onHoldTotal++;

    if (resolved) {
      const assigneeName = incident.assignedTo ?? "Unassigned";
      resolvedByCounts[assigneeName] =
        (resolvedByCounts[assigneeName] ?? 0) + 1;
    }
  }

  const resolvedBy = Object.entries(resolvedByCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

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
    resolvedBy,
  };
}
