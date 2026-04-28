import type { Session } from "@/types";
import { ChevronRight, Zap } from "lucide-react";

export const NextSessionCard = ({
  session,
  onStart,
}: {
  session: Session;
  onStart: (sessionId: string) => void;
}) => {
  return (
    <button
      onClick={() => onStart(session.id)}
      className="bg-primary shadow-primary/25 hover:bg-primary-light w-full rounded-2xl p-5 text-left shadow-lg transition-all active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5">
            <Zap className="text-primary-foreground h-4 w-4" />
            <span className="text-primary-foreground text-xs font-semibold tracking-wider uppercase">
              Next session
            </span>
          </div>
          <p className="text-xl font-bold text-white">{session.label}</p>
          <p className="text-primary-foreground mt-0.5 text-sm">
            {session.exercises.length} exercises
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <ChevronRight className="h-6 w-6 text-white" />
        </div>
      </div>
    </button>
  );
};
