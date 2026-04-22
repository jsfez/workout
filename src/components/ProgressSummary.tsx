import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "../lib/utils";

export const ProgressSummary = ({
  completedCount,
  totalCount,
  progressPct,
  lastCompletedLabel,
  className,
}: {
  completedCount: number;
  totalCount: number;
  progressPct: number;
  lastCompletedLabel?: string;
  className?: string;
}) => {
  return (
    <Card className={cn("rounded-2xl p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text">Progress</span>
        <span className="text-sm font-bold text-primary-light">
          {completedCount}/{totalCount}
        </span>
      </div>
      <Progress value={progressPct} className="h-2" />
      {lastCompletedLabel && (
        <p className="mt-2 text-xs text-text-subtle">
          Last session: {lastCompletedLabel}
        </p>
      )}
    </Card>
  );
};
