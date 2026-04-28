import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export const ThemeToggle = ({ isDarkMode, onToggle }: ThemeToggleProps) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="border-border bg-surface-raised text-text-muted hover:bg-surface-hover hover:text-text flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
      aria-label={
        isDarkMode ? "Activer le mode clair" : "Activer le mode sombre"
      }
    >
      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};
