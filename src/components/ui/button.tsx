import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as React from "react";

const buttonVariants = cva(
  // Base styles for ALL buttons
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive-hover shadow-sm",
        outline: "border border-border bg-transparent text-muted-foreground hover:bg-surface",
        ghost: "text-muted-foreground hover:bg-surface hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        lg: "h-[var(--button-lg)] px-6 rounded-pill text-base",             // 48px — large CTA buttons
        default: "h-[var(--button-md)] px-4 rounded-button text-sm",         // 36px — action bar, modal actions
        sm: "h-[var(--button-sm)] px-3 rounded-button text-sm",              // 32px — compact text buttons
        icon: "h-[var(--button-md)] w-[var(--button-md)] rounded-button",    // 36px square — icon-only action bar
        "icon-sm": "h-[var(--button-sm)] w-[var(--button-sm)] rounded-button", // 32px square — close, bottom bar icons
        "icon-lg": "h-[var(--button-lg)] w-[var(--button-lg)] rounded-pill", // 48px square — dock icons
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
