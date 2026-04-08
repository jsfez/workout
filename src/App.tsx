import { useEffect, useState, useCallback } from "react";
import { Dashboard } from "@/pages/DashboardPage";
import { ExerciseView } from "@/pages/ExercisePage";
import { SessionView } from "@/pages/SessionPage";
import { getStore } from "./store/workoutStore";
import type { WorkoutStore } from "@/types";

const App = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<
    number | null
  >(null);
  const [store, setStore] = useState<WorkoutStore>(() => getStore());
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem("workout-theme");
    if (storedTheme) return storedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const refreshStore = useCallback(() => {
    setStore(getStore());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("workout-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  if (currentSessionId && currentExerciseIndex !== null) {
    return (
      <ExerciseView
        key={`${currentSessionId}-${currentExerciseIndex}`}
        sessionId={currentSessionId}
        exerciseIndex={currentExerciseIndex}
        onBack={() => {
          setCurrentExerciseIndex(null);
          refreshStore();
        }}
        onSelectExercise={(index) => {
          setCurrentExerciseIndex(index);
          refreshStore();
        }}
        store={store}
        onStoreChange={refreshStore}
      />
    );
  }

  if (currentSessionId) {
    return (
      <SessionView
        sessionId={currentSessionId}
        onBack={() => {
          setCurrentExerciseIndex(null);
          setCurrentSessionId(null);
          refreshStore();
        }}
        onSelectExercise={(index) => {
          setCurrentExerciseIndex(index);
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
        setCurrentExerciseIndex(null);
        refreshStore();
      }}
      isDarkMode={isDarkMode}
      onToggleTheme={() => setIsDarkMode((current) => !current)}
      store={store}
    />
  );
};

export default App;
