import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  iconColor?: string;
  iconBgColor?: string;
  /** Optional supporting line under the value, e.g. "12 completed this year" */
  hint?: string;
  /** Optional trend: positive numbers render green with an up arrow */
  delta?: number;
  deltaLabel?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  className,
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  hint,
  delta,
  deltaLabel,
}: StatsCardProps) {
  const showDelta = typeof delta === "number" && !Number.isNaN(delta);
  const positive = (delta ?? 0) >= 0;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-5 pt-5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="mt-2 truncate text-2xl font-bold tracking-tight tabular-nums text-foreground">
              {value}
            </p>
            {showDelta && (
              <p
                className={cn(
                  "mt-1.5 inline-flex items-center gap-1 text-xs font-semibold",
                  positive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {Math.abs(delta!).toLocaleString()}%
                {deltaLabel && (
                  <span className="font-normal text-muted-foreground">
                    {deltaLabel}
                  </span>
                )}
              </p>
            )}
            {hint && !showDelta && (
              <p className="mt-1.5 truncate text-xs text-muted-foreground">
                {hint}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
              iconBgColor
            )}
          >
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
