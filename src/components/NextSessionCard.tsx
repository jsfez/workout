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
      className="w-full rounded-2xl bg-primary p-5 text-left shadow-lg shadow-primary/25 transition-all hover:bg-primary-light active:scale-[0.98]"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-4 h-4 text-primary-foreground" />
            <span className="text-xs font-semibold text-primary-foreground uppercase tracking-wider">
              Prochaine séance
            </span>
          </div>
          <p className="text-xl font-bold text-white">{session.label}</p>
          <p className="mt-0.5 text-sm text-primary-foreground">
            {session.exercises.length} exercices
          </p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
          <ChevronRight className="w-6 h-6 text-white" />
        </div>
      </div>
    </button>
  );
};
