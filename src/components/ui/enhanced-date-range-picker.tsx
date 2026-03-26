import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths, setYear, setMonth, isAfter, isBefore, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import { DayPicker, DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EnhancedDateRangePickerProps {
  startDate?: Date
  endDate?: Date
  onStartDateChange?: (date: Date | undefined) => void
  onEndDateChange?: (date: Date | undefined) => void
  className?: string
}

export function EnhancedDateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className
}: EnhancedDateRangePickerProps) {
  const [leftMonth, setLeftMonth] = React.useState(new Date())
  const [rightMonth, setRightMonth] = React.useState(addMonths(new Date(), 1))
  const [showYearMonthPicker, setShowYearMonthPicker] = React.useState<'left' | 'right' | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  // Generate years array (current year ± 10 years)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i)
  
  // Generate months array
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  const handleMonthChange = (side: 'left' | 'right', direction: 'prev' | 'next') => {
    if (side === 'left') {
      setLeftMonth(direction === 'prev' ? subMonths(leftMonth, 1) : addMonths(leftMonth, 1))
    } else {
      setRightMonth(direction === 'prev' ? subMonths(rightMonth, 1) : addMonths(rightMonth, 1))
    }
  }

  const handleYearMonthSelect = (side: 'left' | 'right', year: number, month: number) => {
    const newDate = setMonth(setYear(new Date(), year), month)
    if (side === 'left') {
      setLeftMonth(newDate)
    } else {
      setRightMonth(newDate)
    }
    setShowYearMonthPicker(null)
  }

  const CustomCaption = ({ side, month }: { side: 'left' | 'right', month: Date }) => {
    if (showYearMonthPicker === side) {
      return (
        <div className="flex flex-col gap-2 p-2">
          <div className="grid grid-cols-3 gap-1">
            {years.map((year) => (
              <Button
                key={year}
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleYearMonthSelect(side, year, month.getMonth())}
              >
                {year}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {months.map((monthName, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => handleYearMonthSelect(side, month.getFullYear(), idx)}
              >
                {monthName}
              </Button>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleMonthChange(side, 'prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          className="font-medium"
          onClick={() => setShowYearMonthPicker(side)}
        >
          {format(month, "MMMM yyyy", { locale: es })}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleMonthChange(side, 'next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Create date range object for highlighting
  const dateRange: DateRange | undefined = startDate && endDate ? { from: startDate, to: endDate } : undefined

  // Function to handle range selection
  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      onStartDateChange?.(range.from)
    }
    if (range?.to) {
      onEndDateChange?.(range.to)
    }
    // Don't auto-close the calendar - let user click outside to close
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-2 gap-4">
        {/* Start Date Input - Main Trigger */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Fecha inicio</label>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                {/* Left Calendar - for start date */}
                <div className="border-r">
                  <div className="p-3">
                    <CustomCaption side="left" month={leftMonth} />
                    {!showYearMonthPicker && (
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={handleRangeSelect}
                        month={leftMonth}
                        locale={es}
                        className="pointer-events-auto"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "hidden",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: cn(
                            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                          ),
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: cn(
                            "relative p-0 text-center text-sm focus-within:relative focus-within:z-20"
                          ),
                          day: cn(
                            "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          ),
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-semibold",
                          day_outside: "text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_start: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md",
                          day_range_end: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md",
                          day_range_middle: "bg-accent/50 text-accent-foreground hover:bg-accent/60",
                          day_hidden: "invisible",
                        }}
                      />
                    )}
                  </div>
                </div>
                
                {/* Right Calendar - for end date */}
                <div>
                  <div className="p-3">
                    <CustomCaption side="right" month={rightMonth} />
                    {!showYearMonthPicker && (
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={handleRangeSelect}
                        month={rightMonth}
                        locale={es}
                        className="pointer-events-auto"
                        classNames={{
                          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption: "hidden",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: cn(
                            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                          ),
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: cn(
                            "relative p-0 text-center text-sm focus-within:relative focus-within:z-20"
                          ),
                          day: cn(
                            "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          ),
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-semibold",
                          day_outside: "text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_start: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md",
                          day_range_end: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-md",
                          day_range_middle: "bg-accent/50 text-accent-foreground hover:bg-accent/60",
                          day_hidden: "invisible",
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date Input - Display Only */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Fecha fin</label>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !endDate && "text-muted-foreground"
            )}
            disabled
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
          </Button>
        </div>
      </div>
    </div>
  )
}