import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "animate-spin rounded-full border-solid border-border border-t-primary",
  {
    variants: {
      size: {
        sm: "h-4 w-4 border-2",
        md: "h-8 w-8 border-2",
        lg: "h-10 w-10 border-[3px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

interface LoaderProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  centered?: boolean;
  label?: string;
  labelClassName?: string;
  spinnerClassName?: string;
}

export const Loader = ({
  className,
  size,
  centered = false,
  label,
  labelClassName,
  spinnerClassName,
  ...props
}: LoaderProps) => {
  return (
    <div
      aria-live="polite"
      className={cn(
        "text-primary inline-flex items-center gap-3",
        centered && "flex w-full flex-1 justify-center py-20",
        className,
      )}
      role="status"
      aria-busy="true"
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(spinnerVariants({ size }), spinnerClassName)}
      />
      {label ? (
        <span
          className={cn("text-text-muted text-sm font-medium", labelClassName)}
        >
          {label}
        </span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
};
