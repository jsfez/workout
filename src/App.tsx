import { useState, useCallback } from "react";
import { Dashboard } from "@/components/Dashboard";
import { SessionView } from "@/components/SessionView";
import { getStore } from "./store/workoutStore";
import type { WorkoutStore } from "@/types";

export default function App() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [store, setStore] = useState<WorkoutStore>(() => getStore());

  const refreshStore = useCallback(() => {
    setStore(getStore());
  }, []);

  if (currentSessionId) {
    return (
      <SessionView
        sessionId={currentSessionId}
        onBack={() => {
          setCurrentSessionId(null);
          refreshStore();
        }}
        store={store}
        onStoreChange={refreshStore}
      />
    );
  }

  return (
    <Dashboard
      onSelectSession={(id) => {
        setCurrentSessionId(id);
        refreshStore();
      }}
      store={store}
    />
  );
}
