import * as React from "react";
import { cn } from "@/lib/utils";

type ColoredEmphaseProps = React.HTMLAttributes<HTMLParagraphElement>;

export const ColoredEmphase = ({
  className,
  ...props
}: ColoredEmphaseProps) => {
  return (
    <p
      className={cn(
        "mb-2 text-xs font-semibold text-primary-light uppercase tracking-widest",
        className,
      )}
      {...props}
    />
  );
};
