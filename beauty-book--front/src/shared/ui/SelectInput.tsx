"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

type SelectInputProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  function SelectInput({ invalid, className = "", ...rest }, ref) {
    const base =
      "relative w-full rounded-lg border bg-background px-4 py-2.5 pr-10 text-sm font-medium outline-none transition-colors appearance-none cursor-pointer";
    const state = invalid
      ? "border-destructive/60 focus:ring-2 focus:ring-destructive/40 text-destructive"
      : "border-border text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary";

    return (
      <div className="relative">
        <select
          ref={ref}
          className={`${base} ${state} ${className}`}
          {...rest}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
      </div>
    );
  },
);
