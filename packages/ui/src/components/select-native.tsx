import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

export type SelectNativeProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const SelectNative = React.forwardRef<HTMLSelectElement, SelectNativeProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-11 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-9 text-sm text-fg shadow-sm focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
    </div>
  )
);
SelectNative.displayName = "SelectNative";
