import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-bold text-text", {
  variants: {
    size: {
      md: "text-xl",
      lg: "text-2xl",
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

interface HeadingProps
  extends
    React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {}

export const Heading = ({ className, size, ...props }: HeadingProps) => {
  return <h1 className={cn(headingVariants({ size }), className)} {...props} />;
};
