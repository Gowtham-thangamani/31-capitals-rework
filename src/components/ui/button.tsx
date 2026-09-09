import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "shine bg-[linear-gradient(135deg,#ffb26a,#ff5a14_55%,#c91800)] text-white shadow-[0_0_28px_rgba(255,90,20,0.35)] hover:shadow-[0_0_42px_rgba(255,90,20,0.5)] hover:brightness-110",
        outline:
          "border border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-orange-400/40",
        ghost: "text-white/80 hover:text-white hover:bg-white/5",
      },
      size: {
        default: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        sm: "h-9 px-4 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
