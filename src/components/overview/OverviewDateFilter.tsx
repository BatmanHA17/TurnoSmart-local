import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card } from '@/components/ui/card';

interface OverviewDateFilterProps {
  onDateRangeChange: (range: string) => void;
}

export const OverviewDateFilter: React.FC<OverviewDateFilterProps> = ({ onDateRangeChange }) => {
  const [selectedRange, setSelectedRange] = useState('todoElTiempo');
  const [isOpen, setIsOpen] = useState(false);

  const dateOptions = [
    { value: 'todoElTiempo', label: 'Todo el tiempo' },
    { value: 'año', label: 'Año' },
    { value: 'trimestre', label: 'Trimestre' },
    { value: 'mes', label: 'Mes' },
    { value: 'día', label: 'Día' },
  ];

  const handleDateSelect = (value: string) => {
    setSelectedRange(value);
    onDateRangeChange(value);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="h-9 px-3 text-sm font-normal border-gray-200 bg-white hover:bg-gray-50 transition-colors rounded-md"
        >
          <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-gray-700">
            {dateOptions.find(opt => opt.value === selectedRange)?.label}
          </span>
          <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1 bg-white border border-gray-200 shadow-lg rounded-md z-50" align="start">
        <div className="space-y-0">
          {dateOptions.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              className={`
                w-full justify-start h-8 px-3 text-sm font-normal rounded-sm
                ${selectedRange === option.value 
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-50' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
              onClick={() => handleDateSelect(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};