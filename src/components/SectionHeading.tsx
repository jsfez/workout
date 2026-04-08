import * as React from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = React.HTMLAttributes<HTMLHeadingElement>;

export const SectionHeading = ({
  className,
  ...props
}: SectionHeadingProps) => {
  return (
    <h2
      className={cn(
        "text-xs font-semibold text-text-subtle uppercase tracking-widest",
        className,
      )}
      {...props}
    />
  );
};
