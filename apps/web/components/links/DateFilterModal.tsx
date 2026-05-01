"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from "@pingtome/ui";
import { format, subDays, subHours, startOfDay, endOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface DateFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (startDate: Date | null, endDate: Date | null) => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

export function DateFilterModal({
  isOpen,
  onClose,
  onApply,
  initialStartDate,
  initialEndDate,
}: DateFilterModalProps) {
  const t = useTranslations("links.dateFilter");
  const [startDate, setStartDate] = useState<Date | null>(
    initialStartDate || null,
  );
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate || null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);

  const QUICK_OPTIONS = [
    {
      label: t("lastHour"),
      getValue: () => ({ start: subHours(new Date(), 1), end: new Date() }),
    },
    {
      label: t("today"),
      getValue: () => ({
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
      }),
    },
    {
      label: t("last7days"),
      getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }),
    },
    {
      label: t("last30days"),
      getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }),
    },
    {
      label: t("last60days"),
      getValue: () => ({ start: subDays(new Date(), 60), end: new Date() }),
    },
    {
      label: t("last90days"),
      getValue: () => ({ start: subDays(new Date(), 90), end: new Date() }),
    },
  ];

  const DAYS = [t("sun"), t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat")];

  const handleQuickOption = (option: (typeof QUICK_OPTIONS)[0]) => {
    const { start, end } = option.getValue();
    setStartDate(start);
    setEndDate(end);
  };

  const handleClearAll = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleApply = () => {
    onApply(startDate, endDate);
    onClose();
  };

  const handleDayClick = (day: Date) => {
    if (selectingStart) {
      setStartDate(day);
      setEndDate(null);
      setSelectingStart(false);
    } else {
      if (startDate && day < startDate) {
        setStartDate(day);
        setEndDate(startDate);
      } else {
        setEndDate(day);
      }
      setSelectingStart(true);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isInRange = (day: Date) => {
    if (!startDate || !endDate) return false;
    return day >= startDate && day <= endDate;
  };

  const isSelected = (day: Date) => {
    if (
      startDate &&
      format(day, "yyyy-MM-dd") === format(startDate, "yyyy-MM-dd")
    )
      return true;
    if (endDate && format(day, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd"))
      return true;
    return false;
  };

  const isToday = (day: Date) => {
    return format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  };

  const isFutureDate = (day: Date) => {
    return day > new Date();
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {t("filterByDate")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <Input
              value={startDate ? format(startDate, "MM/dd/yyyy") : ""}
              readOnly
              placeholder={t("startDate")}
              className="text-center bg-slate-50"
            />
            <Input
              value={endDate ? format(endDate, "MM/dd/yyyy") : ""}
              readOnly
              placeholder={t("endDate")}
              className="text-center bg-slate-50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <span className="font-medium">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm text-slate-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div key={index} className="aspect-square">
                  {day ? (
                    <button
                      onClick={() => handleDayClick(day)}
                      disabled={isFutureDate(day)}
                      className={`w-full h-full flex items-center justify-center text-sm rounded-lg transition-colors
                        ${isSelected(day) ? "bg-blue-600 text-white" : ""}
                        ${isInRange(day) && !isSelected(day) ? "bg-blue-100 text-blue-800" : ""}
                        ${isToday(day) && !isSelected(day) ? "border border-blue-500" : ""}
                        ${isFutureDate(day) ? "text-slate-300 cursor-not-allowed" : "hover:bg-slate-100"}
                        ${!isSelected(day) && !isInRange(day) && !isFutureDate(day) ? "text-slate-700" : ""}
                      `}
                    >
                      {day.getDate()}
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {QUICK_OPTIONS.map((option) => (
              <button
                key={option.label}
                onClick={() => handleQuickOption(option)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-6 pt-4 border-t bg-slate-50">
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
          >
            <X className="h-4 w-4" />
            {t("clearAllFilters")}
          </button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleApply}>{t("apply")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
