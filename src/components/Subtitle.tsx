import * as React from "react";
import { cn } from "@/lib/utils";

type SubtitleProps = React.HTMLAttributes<HTMLParagraphElement>;

export const Subtitle = ({ className, ...props }: SubtitleProps) => {
  return <p className={cn("text-text-muted text-sm", className)} {...props} />;
};
