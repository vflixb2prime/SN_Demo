import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const STORAGE_KEY = "servicenow-api-config";

type StoredConfig = {
  baseUrl: string;
  token: string;
};

type FetchState = {
  loading: boolean;
  error: string | null;
  response: unknown;
};

function ConfigForm({
  baseUrl,
  token,
  onBaseUrlChange,
  onTokenChange,
  onSave,
}: {
  baseUrl: string;
  token: string;
  onBaseUrlChange: (value: string) => void;
  onTokenChange: (value: string) => void;
  onSave: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ServiceNow API Settings</CardTitle>
        <CardDescription>
          Store the API endpoint and bearer token securely in your browser to
          reuse them on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="baseUrl">API Base URL</Label>
          <Input
            id="baseUrl"
            value={baseUrl}
            onChange={(event) => onBaseUrlChange(event.target.value)}
            placeholder="https://instance.service-now.com/api/..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="token">Bearer Token</Label>
          <Textarea
            id="token"
            value={token}
            onChange={(event) => onTokenChange(event.target.value)}
            placeholder="Paste your bearer token"
            rows={4}
          />
        </div>
        <Button type="button" onClick={onSave} className="w-full">
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}

function QueryTester({
  query,
  onQueryChange,
  onFetch,
  finalUrl,
  fetchState,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onFetch: () => void;
  finalUrl: string | null;
  fetchState: FetchState;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Tester</CardTitle>
        <CardDescription>
          Provide a query string to append to your base URL and fetch data
          directly from the browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="query">Query String</Label>
          <Input
            id="query"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="number=INC000111&state=in_progress"
          />
          <p className="text-xs text-muted-foreground">
            When you visit <code>/puseapi?query=...</code>, the query parameter
            will auto-populate this field.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground break-all">
            {finalUrl ? (
              <span>
                Request URL: <code>{finalUrl}</code>
              </span>
            ) : (
              <span>Enter a base URL to preview the final request.</span>
            )}
          </div>
          <Button type="button" onClick={onFetch} disabled={fetchState.loading}>
            {fetchState.loading ? "Fetching…" : "Fetch"}
          </Button>
        </div>
        <div className="space-y-2">
          <Label>Response</Label>
          <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
            {fetchState.error
              ? `Error: ${fetchState.error}`
              : fetchState.response
                ? JSON.stringify(fetchState.response, null, 2)
                : "Run a fetch to see results."}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ServiceNowSettings() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [baseUrl, setBaseUrl] = useState("");
  const [token, setToken] = useState("");
  const [query, setQuery] = useState("");
  const [fetchState, setFetchState] = useState<FetchState>({
    loading: false,
    error: null,
    response: null,
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed: StoredConfig = JSON.parse(stored);
      setBaseUrl(parsed.baseUrl ?? "");
      setToken(parsed.token ?? "");
    } catch (error) {
      console.error("Failed to parse stored ServiceNow config", error);
    }
  }, []);

  useEffect(() => {
    const queryParam = searchParams.get("query") ?? "";
    if (queryParam) {
      setQuery(queryParam);
    }
  }, [searchParams]);

  const finalUrl = useMemo(() => {
    if (!baseUrl) return null;
    const trimmedBase = baseUrl.trim();
    if (!query.trim()) return trimmedBase;
    return `${trimmedBase}${trimmedBase.includes("?") ? "&" : "?"}${query.trim()}`;
  }, [baseUrl, query]);

  const handleSave = () => {
    const trimmedBase = baseUrl.trim();
    const trimmedToken = token.trim();

    if (!trimmedBase || !trimmedToken) {
      toast({
        title: "Missing information",
        description: "Enter both the API URL and bearer token before saving.",
      });
      return;
    }

    const payload: StoredConfig = {
      baseUrl: trimmedBase,
      token: trimmedToken,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    toast({
      title: "Settings saved",
      description: "Your ServiceNow credentials are stored in this browser.",
    });
  };

  const handleFetch = async () => {
    if (!finalUrl) {
      toast({
        title: "Missing URL",
        description: "Provide a valid API base URL first.",
      });
      return;
    }

    setFetchState({ loading: true, error: null, response: null });

    try {
      const response = await fetch(finalUrl, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status} ${response.statusText}: ${text}`);
      }

      const data = await response.json();
      setFetchState({ loading: false, error: null, response: data });
    } catch (error) {
      setFetchState({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
        response: null,
      });
    }
  };

  useEffect(() => {
    if (finalUrl && token.trim() && query.trim()) {
      handleFetch();
    }
    // intentionally ignore handleFetch dependency to avoid re-runs while fetching
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalUrl, token, query]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            ServiceNow API Console
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure your endpoint and token, then run queries directly from
            the browser. Credentials never leave this device.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <ConfigForm
            baseUrl={baseUrl}
            token={token}
            onBaseUrlChange={setBaseUrl}
            onTokenChange={setToken}
            onSave={handleSave}
          />
          <QueryTester
            query={query}
            onQueryChange={setQuery}
            onFetch={handleFetch}
            finalUrl={finalUrl}
            fetchState={fetchState}
          />
        </div>
      </div>
    </MainLayout>
  );
}
