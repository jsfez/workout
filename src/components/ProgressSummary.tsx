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
      <div className="mb-3 flex items-center justify-between">
        <span className="text-text text-sm font-medium">Progress</span>
        <span className="text-primary-light text-sm font-bold">
          {completedCount}/{totalCount}
        </span>
      </div>
      <Progress value={progressPct} className="h-2" />
      {lastCompletedLabel && (
        <p className="text-text-subtle mt-2 text-xs">
          Last session: {lastCompletedLabel}
        </p>
      )}
    </Card>
  );
};
