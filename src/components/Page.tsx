import * as React from "react";
import { cn } from "@/lib/utils";

type PageProps = React.HTMLAttributes<HTMLDivElement>;

export const Page = ({ className, ...props }: PageProps) => {
  return (
    <div
      className={cn(
        "flex min-h-svh flex-col max-w-md gap-6 pb-8 px-5",
        className,
      )}
      {...props}
    />
  );
};
