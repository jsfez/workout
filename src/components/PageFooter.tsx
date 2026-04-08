import * as React from "react";
import { cn } from "@/lib/utils";

type PageFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const PageFooter = ({
  className,
  children,
  ...props
}: PageFooterProps) => {
  return (
    <div
      className={cn(
        "fixed left-0 right-0 bottom-0 pb-safe pb-4 pt-2 shadow bg-background",
        className,
      )}
      {...props}
    >
      <div className="mx-auto max-w-md px-5">{children}</div>
    </div>
  );
};
