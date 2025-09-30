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
      "bg-gradient-to-br from-emerald-400/20 via-emerald-400/10 to-transparent border-emerald-400/30 text-foreground",
    warning:
      "bg-gradient-to-br from-amber-400/20 via-amber-400/10 to-transparent border-amber-400/30 text-foreground",
    muted:
      "bg-gradient-to-br from-muted to-background border-border text-foreground",
    destructive:
      "bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent border-red-500/30 text-foreground",
  };

  return (
    <Card className={cn("overflow-hidden", toneClasses[tone], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon && <div className="text-muted-foreground/70">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
