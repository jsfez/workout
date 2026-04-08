import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
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

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export { badgeVariants };
export type { BadgeVariant };
