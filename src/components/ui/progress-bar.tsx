import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  color?: string;
}

export default function ProgressBar({
  value,
  className,
  color = "bg-primary",
}: ProgressBarProps) {
  return (
    <div className="flex items-center">
      <div className={cn("w-16 bg-gray-200 rounded-full h-2 mr-2", className)}>
        <div
          className={cn("h-2 rounded-full transition-all duration-300", color)}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground">{value}%</span>
    </div>
  );
}
