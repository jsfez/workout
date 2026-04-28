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
        "text-primary-light mb-2 text-xs font-semibold tracking-widest uppercase",
        className,
      )}
      {...props}
    />
  );
};
