import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-white/12 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-orange-400/70 focus:bg-white/8 focus:ring-2 focus:ring-orange-500/20",
        className,
      )}
      {...props}
    />
  );
}
