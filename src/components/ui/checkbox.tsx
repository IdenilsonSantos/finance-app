"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & { indeterminate?: boolean }
>(({ className, indeterminate, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    checked={indeterminate ? "indeterminate" : props.checked}
    className={cn(
      "h-4 w-4 shrink-0 rounded-[4px] border border-slate-300 bg-white transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "hover:border-slate-400",
      "data-[state=checked]:bg-[#1E1E2D] data-[state=checked]:border-[#1E1E2D]",
      "data-[state=indeterminate]:bg-[#1E1E2D] data-[state=indeterminate]:border-[#1E1E2D]",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
      {indeterminate
        ? <Minus className="h-3 w-3" strokeWidth={3} />
        : <Check className="h-3 w-3" strokeWidth={3} />}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
