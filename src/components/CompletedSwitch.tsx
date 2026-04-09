import { cn } from "../lib/utils";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

export const CompletedSwitch = ({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div
    className={cn(
      "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2",
      checked
        ? "border-success bg-success/10"
        : "border-border bg-surface-raised",
    )}
  >
    <Switch
      id="session-completed"
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="data-[state=checked]:border-success data-[state=checked]:bg-success"
    />
    <Label htmlFor="session-completed" className="cursor-pointer">
      Terminée
    </Label>
  </div>
);
