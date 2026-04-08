import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { badgeVariants, type BadgeVariant } from "@/components/ui/badge-variants";
import { cn } from "@/lib/utils";

const Badge = ({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  { variant?: BadgeVariant; asChild?: boolean }) => {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
};

export { Badge };
