import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border-2 border-foreground font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--accent)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--accent)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        accent:
          "bg-accent text-accent-foreground shadow-[3px_3px_0_0_var(--foreground)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--foreground)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        outline: "bg-card text-foreground hover:bg-muted active:translate-y-px",
        ghost: "border-transparent bg-transparent hover:bg-muted",
        danger: "border-danger bg-danger-soft text-danger hover:bg-danger hover:text-white",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";
