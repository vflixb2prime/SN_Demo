import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  className?: string;
  tone?: "primary" | "success" | "warning" | "muted" | "destructive";
}

export function StatCard({
  label,
  value,
  icon,
  className,
  tone = "primary",
}: StatCardProps) {
  const toneClasses: Record<string, string> = {
    primary:
      "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 text-foreground",
    success:
      "bg-gradient-to-br from-emerald-400/15 via-emerald-400/5 to-transparent border-emerald-400/30 text-foreground",
    warning:
      "bg-gradient-to-br from-amber-400/15 via-amber-400/5 to-transparent border-amber-400/30 text-foreground",
    muted:
      "bg-gradient-to-br from-muted to-background border-border text-foreground",
    destructive:
      "bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent border-red-500/30 text-foreground",
  };

  const valueDisplay =
    typeof value === "number" ? value.toLocaleString("en-US") : value;

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-md border border-border/60 bg-card/80 text-left shadow-sm",
        toneClasses[tone],
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
        {icon && <div className="text-muted-foreground/70">{icon}</div>}
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="text-2xl font-semibold tracking-tight tabular-nums">
          {valueDisplay}
        </div>
      </CardContent>
    </Card>
  );
}
