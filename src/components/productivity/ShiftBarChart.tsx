import { useState } from "react";

interface BarDataItem {
  label: string;
  value: number;
  max: number;
}

interface ShiftBarChartProps {
  data: BarDataItem[];
  title?: string;
}

export function ShiftBarChart({ data, title }: ShiftBarChartProps) {
  const [tooltip, setTooltip] = useState<{ index: number; x: number; y: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Sin datos para el período seleccionado
      </div>
    );
  }

  const globalMax = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full">
      {title && <p className="text-sm font-medium text-muted-foreground mb-3">{title}</p>}
      <div className="flex items-end gap-1 h-40 relative">
        {data.map((item, i) => {
          const pct = Math.max(0, Math.min(100, (item.value / globalMax) * 100));
          return (
            <div
              key={i}
              className="flex flex-col items-center flex-1 min-w-0 h-full justify-end"
            >
              {/* Bar wrapper */}
              <div className="w-full flex flex-col justify-end" style={{ height: "calc(100% - 20px)" }}>
                <div
                  className="w-full rounded-t bg-primary transition-all duration-300 cursor-pointer hover:bg-primary/80 relative group"
                  style={{ height: `${pct}%`, minHeight: item.value > 0 ? "4px" : "0" }}
                  onMouseEnter={(e) => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect();
                    setTooltip({ index: i, x: rect.left + rect.width / 2, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Tooltip */}
                  {tooltip?.index === i && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 bg-popover text-popover-foreground text-xs rounded shadow-md px-2 py-1 whitespace-nowrap border border-border">
                      {item.label}: {item.value}
                    </div>
                  )}
                </div>
              </div>
              {/* Label */}
              <span
                className="mt-1 text-[10px] text-muted-foreground text-center w-full truncate"
                title={item.label}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
