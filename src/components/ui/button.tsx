import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-light",
        secondary:
          "border border-border bg-surface-raised text-text hover:bg-surface-hover",
        ghost: "text-text-muted hover:bg-white/5 hover:text-text",
        danger: "border border-danger/20 bg-danger/10 text-danger-foreground",
        success: "bg-success text-white shadow-lg shadow-success/20",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-14 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
