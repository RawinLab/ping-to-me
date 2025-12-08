"use client";

import * as React from "react";
import { Progress } from "@pingtome/ui";
import { Button } from "@pingtome/ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressWithLabelProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  showCount?: boolean;
  onCancel?: () => void;
  className?: string;
}

export function ProgressWithLabel({
  value,
  max,
  label,
  showPercentage = true,
  showCount = true,
  onCancel,
  className,
}: ProgressWithLabelProps) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {label && <span className="font-medium">{label}</span>}
          {showCount && (
            <span className="text-muted-foreground">
              {value} of {max}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showPercentage && (
            <span className="text-muted-foreground">{percentage}%</span>
          )}
          {onCancel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cancel</span>
            </Button>
          )}
        </div>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

// Export a simpler variant for inline use
export function InlineProgress({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const percentage = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress value={percentage} className="h-1.5 flex-1" />
      <span className="text-xs text-muted-foreground w-8">{percentage}%</span>
    </div>
  );
}
