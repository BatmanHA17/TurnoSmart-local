import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface OverviewSimpleFilterProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export const OverviewSimpleFilter: React.FC<OverviewSimpleFilterProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Seleccionar",
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`h-9 px-3 text-sm font-normal border-gray-200 bg-white hover:bg-gray-50 transition-colors rounded-md ${className}`}
        >
          <span className="text-gray-700 flex-1 text-left truncate">
            {displayText}
          </span>
          <ChevronDown className="h-4 w-4 ml-2 text-gray-400 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1 bg-white border border-gray-200 shadow-lg rounded-md z-50" align="start">
        <div className="space-y-0">
          {options.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              className={`
                w-full justify-start h-8 px-3 text-sm font-normal rounded-sm
                ${value === option.value 
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-50' 
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};