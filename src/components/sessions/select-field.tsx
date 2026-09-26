"use client";

import { Select } from "@/components/ui/form";
import { cn } from "@/lib/utils";

/** UI kit `Select` + aniq ko‘rinadigan strelka (ikonka) */
export function SelectField({
  className,
  wrapperClassName,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string; iconClassName?: string }) {
  return (
    <div className={cn("relative min-w-0", wrapperClassName)}>
      <Select {...props} className={cn("truncate pr-10", className)}>
        {children}
      </Select>
    </div>
  );
}
