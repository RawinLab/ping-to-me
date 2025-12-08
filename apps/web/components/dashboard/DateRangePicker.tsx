"use client";

import { useState } from "react";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  startOfToday,
  endOfToday,
} from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
} from "@pingtome/ui";
import { cn } from "@pingtome/ui";

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

interface Preset {
  label: string;
  getValue: () => DateRange;
}

const PRESETS: Preset[] = [
  {
    label: "Today",
    getValue: () => ({
      start: startOfToday(),
      end: endOfToday(),
    }),
  },
  {
    label: "7 Days",
    getValue: () => ({
      start: startOfDay(subDays(new Date(), 6)),
      end: endOfToday(),
    }),
  },
  {
    label: "30 Days",
    getValue: () => ({
      start: startOfDay(subDays(new Date(), 29)),
      end: endOfToday(),
    }),
  },
  {
    label: "90 Days",
    getValue: () => ({
      start: startOfDay(subDays(new Date(), 89)),
      end: endOfToday(),
    }),
  },
  {
    label: "1 Year",
    getValue: () => ({
      start: startOfDay(subDays(new Date(), 364)),
      end: endOfToday(),
    }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [tempStart, setTempStart] = useState<Date | undefined>(value.start);
  const [tempEnd, setTempEnd] = useState<Date | undefined>(value.end);

  // Determine which preset is currently selected, if any
  const getCurrentPreset = () => {
    const currentStart = startOfDay(value.start).getTime();
    const currentEnd = endOfDay(value.end).getTime();

    for (const preset of PRESETS) {
      const presetRange = preset.getValue();
      const presetStart = startOfDay(presetRange.start).getTime();
      const presetEnd = endOfDay(presetRange.end).getTime();

      if (currentStart === presetStart && currentEnd === presetEnd) {
        return preset.label;
      }
    }

    return null;
  };

  const currentPreset = getCurrentPreset();

  const handlePresetClick = (preset: Preset) => {
    const range = preset.getValue();
    onChange(range);
    setCustomMode(false);
    setOpen(false);
  };

  const handleCustomClick = () => {
    setCustomMode(true);
    setTempStart(value.start);
    setTempEnd(value.end);
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      // Validate: end must be >= start
      if (tempEnd < tempStart) {
        // Swap dates if end is before start
        onChange({
          start: startOfDay(tempEnd),
          end: endOfDay(tempStart),
        });
      } else {
        onChange({
          start: startOfDay(tempStart),
          end: endOfDay(tempEnd),
        });
      }
      setCustomMode(false);
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setCustomMode(false);
    setTempStart(value.start);
    setTempEnd(value.end);
  };

  const formatDateRange = () => {
    if (currentPreset) {
      return currentPreset;
    }
    return `${format(value.start, "MMM d, yyyy")} - ${format(value.end, "MMM d, yyyy")}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal gap-2 min-w-[240px]",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1">{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        {!customMode ? (
          <div className="p-3 space-y-1">
            {/* Preset Buttons */}
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                  currentPreset === preset.label
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {preset.label}
              </button>
            ))}

            {/* Custom Option */}
            <button
              onClick={handleCustomClick}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                !currentPreset
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              Custom
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {/* Custom Mode Header */}
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-semibold text-sm">Select Date Range</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Date Inputs */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Start Date
                </label>
                <Calendar
                  mode="single"
                  selected={tempStart}
                  onSelect={(date) => date && setTempStart(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  End Date
                </label>
                <Calendar
                  mode="single"
                  selected={tempEnd}
                  onSelect={(date) => date && setTempEnd(date)}
                  disabled={(date) =>
                    date > new Date() || (tempStart ? date < tempStart : false)
                  }
                />
              </div>
            </div>

            {/* Validation Message */}
            {tempStart && tempEnd && tempEnd < tempStart && (
              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded-md">
                End date should be after start date. Dates will be swapped.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!tempStart || !tempEnd}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
