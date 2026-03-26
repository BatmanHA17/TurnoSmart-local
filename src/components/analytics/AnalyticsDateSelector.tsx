import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i); // From 5 years ago to 2 years ahead

interface AnalyticsDateSelectorProps {
  mode: 'relative' | 'specific';
  monthsBack: number;
  specificMonth: number;
  specificYear: number;
  onModeChange: (mode: 'relative' | 'specific') => void;
  onRelativeChange: (months: number) => void;
  onSpecificChange: (month: number, year: number) => void;
}

export function AnalyticsDateSelector({
  mode,
  monthsBack,
  specificMonth,
  specificYear,
  onModeChange,
  onRelativeChange,
  onSpecificChange,
}: AnalyticsDateSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tabs value={mode} onValueChange={(v) => onModeChange(v as 'relative' | 'specific')}>
        <TabsList className="h-8">
          <TabsTrigger value="relative" className="text-xs px-2 h-6">
            Relativo
          </TabsTrigger>
          <TabsTrigger value="specific" className="text-xs px-2 h-6">
            Mes específico
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === 'relative' ? (
        <Select value={monthsBack.toString()} onValueChange={(v) => onRelativeChange(Number(v))}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Último mes</SelectItem>
            <SelectItem value="3">Últimos 3 meses</SelectItem>
            <SelectItem value="6">Últimos 6 meses</SelectItem>
            <SelectItem value="12">Último año</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex items-center gap-1">
          <Select 
            value={specificMonth.toString()} 
            onValueChange={(v) => onSpecificChange(Number(v), specificYear)}
          >
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select 
            value={specificYear.toString()} 
            onValueChange={(v) => onSpecificChange(specificMonth, Number(v))}
          >
            <SelectTrigger className="w-[80px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
