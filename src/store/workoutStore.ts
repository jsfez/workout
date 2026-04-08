import type { SessionLog, WorkoutStore } from "../types";

const STORAGE_KEY = "workout-tracker";

function loadStore(): WorkoutStore {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw) as WorkoutStore;
  return { logs: [], currentSessionId: null };
}

function saveStore(store: WorkoutStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function createLog(sessionId: string): SessionLog {
  return {
    sessionId,
    date: new Date().toISOString(),
    loads: {},
    completedExercises: {},
    completed: false,
  };
}

function getOrCreateLog(store: WorkoutStore, sessionId: string): SessionLog {
  let log = store.logs.find((l) => l.sessionId === sessionId);

  if (!log) {
    log = createLog(sessionId);
    store.logs.push(log);
  }

  log.completedExercises ??= {};

  return log;
}

export function getStore(): WorkoutStore {
  return loadStore();
}

export function getLog(sessionId: string): SessionLog | undefined {
  return loadStore().logs.find((l) => l.sessionId === sessionId);
}

export function startSession(sessionId: string): void {
  const store = loadStore();
  store.currentSessionId = sessionId;
  getOrCreateLog(store, sessionId);
  saveStore(store);
}

export function updateLoad(
  sessionId: string,
  exerciseName: string,
  load: string,
): void {
  const store = loadStore();
  const log = getOrCreateLog(store, sessionId);
  log.loads[exerciseName] = load;
  saveStore(store);
}

export function setExerciseCompleted(
  sessionId: string,
  exerciseName: string,
  completed: boolean,
  exerciseNames: string[],
): void {
  const store = loadStore();
  const log = getOrCreateLog(store, sessionId);
  log.completedExercises[exerciseName] = completed;

  if (exerciseNames.every((name) => log.completedExercises[name])) {
    log.completed = true;
  } else if (!completed) {
    log.completed = false;
  }

  saveStore(store);
}

export function setSessionCompleted(
  sessionId: string,
  completed: boolean,
): void {
  const store = loadStore();
  const log = getOrCreateLog(store, sessionId);
  log.completed = completed;
  saveStore(store);
}

export function completeSession(sessionId: string): void {
  const store = loadStore();
  const log = getOrCreateLog(store, sessionId);
  log.completed = true;
  store.currentSessionId = null;
  saveStore(store);
}

export function getLastLoadForExercise(
  exerciseName: string,
  beforeSessionId: string,
  allSessionIds: string[],
): string | null {
  const store = loadStore();
  const idx = allSessionIds.indexOf(beforeSessionId);
  // Look backwards through previous sessions
  for (let i = idx - 1; i >= 0; i--) {
    const log = store.logs.find((l) => l.sessionId === allSessionIds[i]);
    if (log?.loads[exerciseName]) {
      return log.loads[exerciseName];
    }
  }
  return null;
}
