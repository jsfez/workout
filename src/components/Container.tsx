import * as React from "react";
import { cn } from "@/lib/utils";

type ContainerProps = React.HTMLAttributes<HTMLDivElement>;

export const Container = ({ className, ...props }: ContainerProps) => {
  return <div className={cn("max-w-md", className)} {...props} />;
};
