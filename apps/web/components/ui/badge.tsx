import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-primary/20",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
        outline: "border-border text-foreground",
        conforme: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
        surveille: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
        risque: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
        fractionnement: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
        secondary: "bg-secondary text-secondary-foreground border-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
