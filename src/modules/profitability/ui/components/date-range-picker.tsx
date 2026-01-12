"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PresetRange = "today" | "7d" | "30d" | "90d" | "year" | "all" | "custom";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [preset, setPreset] = useState<PresetRange>("all");

  const handlePresetChange = (value: PresetRange) => {
    setPreset(value);

    if (value === "all") {
      onDateRangeChange(undefined);
      return;
    }

    if (value === "custom") {
      return;
    }

    const now = new Date();
    const from = new Date();

    switch (value) {
      case "today":
        from.setHours(0, 0, 0, 0);
        break;
      case "7d":
        from.setDate(now.getDate() - 7);
        break;
      case "30d":
        from.setDate(now.getDate() - 30);
        break;
      case "90d":
        from.setDate(now.getDate() - 90);
        break;
      case "year":
        from.setFullYear(now.getFullYear(), 0, 1);
        break;
    }

    onDateRangeChange({ from, to: now });
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    onDateRangeChange(range);
    if (range) {
      setPreset("custom");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={preset} onValueChange={(v) => handlePresetChange(v as PresetRange)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo</SelectItem>
          <SelectItem value="today">Hoy</SelectItem>
          <SelectItem value="7d">Últimos 7 días</SelectItem>
          <SelectItem value="30d">Últimos 30 días</SelectItem>
          <SelectItem value="90d">Últimos 90 días</SelectItem>
          <SelectItem value="year">Este año</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
                  {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                </>
              ) : (
                format(dateRange.from, "dd MMM yyyy", { locale: es })
              )
            ) : (
              <span>Seleccionar fechas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
