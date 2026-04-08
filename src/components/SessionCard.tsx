import { cva } from "class-variance-authority";
import { CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export type SessionCardStatus = "completed" | "current" | "next" | "default";

const sessionCardVariants = cva(
  "w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] text-left",
  {
    variants: {
      status: {
        completed: "bg-success/5 border-success/20",
        current: "bg-primary/10 border-primary/30",
        next: "bg-surface-raised border-primary/30",
        default: "bg-surface-raised border-border",
      },
    },
    defaultVariants: {
      status: "default",
    },
  },
);

const SessionStatusIcon = ({
  day,
  isCompleted,
  isCurrent,
}: {
  day: number;
  isCompleted: boolean;
  isCurrent: boolean;
}) => {
  return (
    <div
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
        isCompleted && "bg-success/20",
        isCurrent && "bg-primary/20",
        !isCompleted && !isCurrent && "bg-surface-muted",
      )}
    >
      {isCompleted ? (
        <CheckCircle2 className="w-5 h-5 text-success-foreground" />
      ) : isCurrent ? (
        <Clock className="w-5 h-5 text-primary-light" />
      ) : (
        <span className="text-sm font-bold text-text-subtle">#{day}</span>
      )}
    </div>
  );
};

export const SessionCard = ({
  day,
  label,
  meta,
  status,
  onClick,
}: {
  day: number;
  label: string;
  meta: string;
  status: SessionCardStatus;
  onClick: () => void;
}) => {
  const isCompleted = status === "completed";
  const isCurrent = status === "current";

  return (
    <button onClick={onClick} className={cn(sessionCardVariants({ status }))}>
      <div className="flex items-center gap-3">
        <SessionStatusIcon
          day={day}
          isCompleted={isCompleted}
          isCurrent={isCurrent}
        />
        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              isCompleted ? "text-text-muted" : "text-text",
            )}
          >
            {label}
          </p>
          <p className="text-xs text-text-subtle">{meta}</p>
        </div>
      </div>
      <ChevronRight
        className={cn(
          "w-4 h-4 shrink-0",
          isCompleted ? "text-text-faint" : "text-text-subtle",
        )}
      />
    </button>
  );
};
