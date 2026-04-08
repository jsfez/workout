import { ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

interface BackButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

export const BackButton = ({ label, onClick, className }: BackButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 text-text-muted transition-colors hover:text-text mb-4",
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="text-sm">{label}</span>
    </button>
  );
};
