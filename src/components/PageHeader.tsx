import * as React from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const PageHeader = ({ className, ...props }: PageHeaderProps) => {
  return <div className={cn("pt-6", className)} {...props} />;
};

export const FixedPageHeader = ({
  className,
  children,
  ...props
}: PageHeaderProps) => {
  return (
    <div
      className={cn("fixed top-0 left-0 right-0 bg-background z-20", className)}
      {...props}
    >
      <div className="mx-auto max-w-md pt-6 pb-4 px-5">{children}</div>
    </div>
  );
};
