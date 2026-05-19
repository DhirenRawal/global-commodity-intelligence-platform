import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ConfidenceBadge({ confidence, className }: { confidence?: string; className?: string }) {
  const value = confidence ?? "Medium";
  return (
    <Badge
      variant="outline"
      className={cn(
        value === "High" ? "border-success/40 text-success" : value === "Watch" || value === "Low" ? "border-destructive/40 text-destructive" : "border-yellow-400/40 text-yellow-400",
        className,
      )}
    >
      Confidence {value}
    </Badge>
  );
}

export function SourceBadge({ source, updated, compact = false }: { source?: string; updated?: string; compact?: boolean }) {
  return (
    <Badge variant="outline" className="max-w-full gap-1 border-border text-muted-foreground">
      <span className="truncate">Source: {source ?? "Reference model"}</span>
      {!compact && updated ? <span className="text-foreground/70">/ {updated}</span> : null}
    </Badge>
  );
}

export function DataStatusBadge({ status = "Delayed" }: { status?: "Live" | "Delayed" | "Estimated" | "Official annual" | string }) {
  const cls = status === "Live" ? "border-success/40 text-success" : status === "Estimated" ? "border-yellow-400/40 text-yellow-400" : "border-border text-muted-foreground";
  return <Badge variant="outline" className={cls}>{status}</Badge>;
}

export function RiskBadge({ label, level }: { label: string; level?: string }) {
  const cls = level === "high" ? "border-destructive/40 text-destructive" : level === "medium" ? "border-yellow-400/40 text-yellow-400" : "border-success/40 text-success";
  return <Badge variant="outline" className={cls}>{label}: {level ?? "n/a"}</Badge>;
}

export function NewsImpactBadge({ impact }: { impact?: string }) {
  const value = impact ?? "Mixed";
  const cls = value === "Bullish" ? "border-success/40 text-success" : value === "Bearish" ? "border-destructive/40 text-destructive" : "border-yellow-400/40 text-yellow-400";
  return <Badge variant="outline" className={cls}>{value}</Badge>;
}
