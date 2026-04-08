import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

export const CompletedSwitch = ({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <div className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2">
    <Switch
      id="session-completed"
      checked={checked}
      onCheckedChange={onCheckedChange}
    />
    <Label htmlFor="session-completed">Terminée</Label>
  </div>
);
