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
        "fixed left-0 right-0 bottom-0 bg-background pt-2 shadow",
        className,
      )}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
      {...props}
    >
      <div className="mx-auto max-w-md px-5">{children}</div>
    </div>
  );
};
