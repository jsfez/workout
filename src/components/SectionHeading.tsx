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
        "text-text-subtle text-xs font-semibold tracking-widest uppercase",
        className,
      )}
      {...props}
    />
  );
};
