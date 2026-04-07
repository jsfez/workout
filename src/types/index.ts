export interface Exercise {
  name: string;
  sets: number;
  reps: number | string;
  rpe: number;
  rest: string;
  programLoad: string; // load from the program (may be empty)
  maxLoad: string; // max load ever done
  notes: string;
}

export interface Session {
  id: string; // e.g. "week1-1"
  label: string; // e.g. "WEEK 1 - #1"
  week: number;
  day: number;
  exercises: Exercise[];
}

export interface SessionLog {
  sessionId: string;
  date: string; // ISO date string
  loads: Record<string, string>; // exerciseName -> load used
  completed: boolean;
}

export interface WorkoutStore {
  logs: SessionLog[];
  currentSessionId: string | null;
}
