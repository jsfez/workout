import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statCardVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-xl border border-transparent py-3 font-medium whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3.5 flex-1",
  {
    variants: {
      variant: {
        default: "bg-surface ",
        secondary: "bg-surface-muted text-text-muted",
        destructive: "bg-danger/10 text-danger-foreground",
        outline: "border-border text-text",
        success: "border-success/20 bg-success/10 text-success-foreground",
        warning: "bg-warning/10 text-warning-foreground",
        ghost: "text-text-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type StatCardVariant = VariantProps<typeof statCardVariants>["variant"];

export const StatCard = ({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: StatCardVariant;
  asChild?: boolean;
}) => {
  return (
    <div
      data-variant={variant}
      className={cn(statCardVariants({ variant }), className)}
      {...props}
    />
  );
};
