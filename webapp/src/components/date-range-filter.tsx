"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

interface DateRangeFilterProps {
  from?: string;
  to?: string;
}

export function DateRangeFilter({ from, to }: DateRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromDate, setFromDate] = useState<Date | undefined>(
    from ? new Date(from) : undefined,
  );
  const [toDate, setToDate] = useState<Date | undefined>(
    to ? new Date(to) : undefined,
  );

  const updateParams = useCallback(
    (newFrom: Date | undefined, newTo: Date | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newFrom) {
        params.set("from", format(newFrom, "yyyy-MM-dd"));
      } else {
        params.delete("from");
      }
      if (newTo) {
        params.set("to", format(newTo, "yyyy-MM-dd"));
      } else {
        params.delete("to");
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex items-center gap-2">
      <DatePicker
        label="From"
        date={fromDate}
        onSelect={(d) => {
          setFromDate(d);
          updateParams(d, toDate);
        }}
      />
      <DatePicker
        label="To"
        date={toDate}
        onSelect={(d) => {
          setToDate(d);
          updateParams(fromDate, d);
        }}
      />
      {(fromDate || toDate) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setFromDate(undefined);
            setToDate(undefined);
            updateParams(undefined, undefined);
          }}
        >
          Clear
        </Button>
      )}
    </div>
  );
}

function DatePicker({
  label,
  date,
  onSelect,
}: {
  label: string;
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[160px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {date ? format(date, "MMM d, yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
