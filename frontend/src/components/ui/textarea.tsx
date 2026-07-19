import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-white/10 placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-xl border bg-[#211F1D] px-3 py-2 text-base transition-[color,box-shadow] outline-none focus:ring-2 focus:ring-[#E8B86D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B86D] focus-visible:outline-none focus-visible:border-[#E8B86D]/40 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
