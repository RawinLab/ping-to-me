"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from "@pingtome/ui";
import { Calendar } from "lucide-react";

export interface DateRangeSelectorProps {
  value: number;
  onChange: (days: number) => void;
  options?: number[];
  className?: string;
}

const DEFAULT_OPTIONS = [7, 30, 90];

export function DateRangeSelector({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  className,
}: DateRangeSelectorProps) {
  const formatLabel = (days: number): string => {
    return `Last ${days} days`;
  };

  return (
    <Select
      value={value.toString()}
      onValueChange={(val) => onChange(Number(val))}
    >
      <SelectTrigger
        className={cn(
          "w-[180px] h-9 bg-background border-input hover:bg-accent hover:text-accent-foreground transition-colors",
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Select range" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((days) => (
          <SelectItem key={days} value={days.toString()}>
            {formatLabel(days)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
