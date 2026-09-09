import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-medium uppercase tracking-[0.16em] text-white/55", className)}
      {...props}
    />
  );
}
