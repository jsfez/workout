import * as React from "react";
import { cn } from "@/lib/utils";

type PageProps = React.HTMLAttributes<HTMLDivElement>;

export const Page = ({ className, ...props }: PageProps) => {
  return (
    <div
      className={cn(
        "flex min-h-svh max-w-md flex-col gap-6 px-5 pb-8",
        className,
      )}
      {...props}
    />
  );
};
