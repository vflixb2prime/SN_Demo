import MainLayout from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
  fetchIncidentSummary,
  MissingServiceNowConfigError,
} from "@/utils/api/incidents";
import {
  getStoredServiceNowConfig,
  type ServiceNowConfig,
} from "@/utils/servicenow";
import { IncidentSummaryResponse } from "@shared/api";
import {
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Gauge,
  PauseCircle,
  PlusCircle,
  UserX,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

function formatAssigneeName(name: string) {
  if (name === "Unassigned") return name;
  return name
    .split(/[\s_-]+/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Index() {
  const [config, setConfig] = useState<ServiceNowConfig | null>(() =>
    getStoredServiceNowConfig(),
  );
  const [searchParams] = useSearchParams();
  const overrideQuery = useMemo(
    () => searchParams.get("query") ?? undefined,
    [searchParams],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const refreshConfig = () => {
      setConfig(getStoredServiceNowConfig());
    };

    refreshConfig();

    window.addEventListener("storage", refreshConfig);
    window.addEventListener("servicenow-config-updated", refreshConfig as EventListener);
    return () => {
      window.removeEventListener("storage", refreshConfig);
      window.removeEventListener(
        "servicenow-config-updated",
        refreshConfig as EventListener,
      );
    };
  }, []);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    error,
  } = useQuery<IncidentSummaryResponse>({
    queryKey: [
      "incident-summary",
      config?.baseUrl,
      config?.defaultQuery,
      overrideQuery,
    ],
    queryFn: () => fetchIncidentSummary({ query: overrideQuery }),
    enabled: Boolean(config),
    refetchInterval: 60_000,
    retry: false,
  });

  const summary = data?.summary;

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            ServiceNow Incident Status
          </h1>
          <p className="text-sm text-muted-foreground">
            Live overview of incidents — updated{" "}
            {isFetching
              ? "now"
              : data
                ? new Date(data.generatedAt).toLocaleString()
                : ""}
          </p>
        </div>
        <button
          className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => refetch()}
        >
          <Gauge className="mr-2 h-4 w-4" /> Refresh
        </button>
      </div>

      {!config ? (
        <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <p className="mb-3 font-medium text-foreground">
            Connect your ServiceNow API first
          </p>
          <p className="mb-4">
            Save your API endpoint and bearer token on the API Console page to
            populate the dashboard.
          </p>
          <Button asChild>
            <Link to="/puseapi">Go to API Console</Link>
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm">
          {error instanceof MissingServiceNowConfigError
            ? "ServiceNow configuration not found. Save your API details on the API Console page."
            : error?.message ?? "Failed to fetch ServiceNow data."}
        </div>
      ) : summary ? (
        <div className="space-y-10">
          {/* Today Section */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">Today</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Total Incident Count"
                value={summary.todayTotal}
                icon={<BarChart3 className="h-4 w-4" />}
                tone="primary"
              />
              <StatCard
                label="Today Raised Incident"
                value={summary.todayRaised}
                icon={<PlusCircle className="h-4 w-4" />}
                tone="warning"
              />
              <StatCard
                label="Today Resolved Incident"
                value={summary.todayResolved}
                icon={<CheckCircle2 className="h-4 w-4" />}
                tone="success"
              />
            </div>
          </section>

          {/* Yesterday Section */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">
                Yesterday
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Yesterday Raised Incident"
                value={summary.yesterdayRaised}
                icon={<PlusCircle className="h-4 w-4" />}
                tone="warning"
              />
              <StatCard
                label="Yesterday Resolved Incident"
                value={summary.yesterdayResolved}
                icon={<CheckCircle2 className="h-4 w-4" />}
                tone="success"
              />
            </div>
          </section>

          {/* Current Month Section */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">
                Current Month
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Total Incident Count (Month)"
                value={summary.currentMonthTotal}
                icon={<BarChart3 className="h-4 w-4" />}
                tone="primary"
              />
              <StatCard
                label="Resolved Incident (Month)"
                value={summary.currentMonthResolved}
                icon={<CheckCircle2 className="h-4 w-4" />}
                tone="success"
              />
            </div>
          </section>

          {/* New Section */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">
                Additional
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Not Assigned Incident Count"
                value={summary.notAssigned}
                icon={<UserX className="h-4 w-4" />}
                tone="muted"
              />
              <StatCard
                label="Total On Hold Incident"
                value={summary.onHoldTotal}
                icon={<PauseCircle className="h-4 w-4" />}
                tone="destructive"
              />
            </div>
          </section>

          {summary.resolvedBy.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight">
                  Resolved by
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {summary.resolvedBy.map(({ name, count }) => (
                  <StatCard
                    key={name}
                    label={formatAssigneeName(name)}
                    value={count}
                    tone="success"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-muted-foreground/10 bg-muted/30 p-4 text-sm text-muted-foreground">
          No data available. Verify your query on the API Console page.
        </div>
      )}
    </MainLayout>
  );
}
