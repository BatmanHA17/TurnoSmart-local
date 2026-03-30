import { useState } from "react";

interface ShiftTypeDonutProps {
  data: Record<string, number>;
}

const PALETTE = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#eab308",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#a855f7",
];

export function ShiftTypeDonut({ data }: ShiftTypeDonutProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const total = entries.reduce((sum, [, v]) => sum + v, 0);

  if (total === 0 || entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Sin datos para el período seleccionado
      </div>
    );
  }

  // Build SVG donut using conic-gradient approach via CSS
  let cumulativePct = 0;
  const segments = entries.map(([label, value], i) => {
    const pct = (value / total) * 100;
    const seg = { label, value, pct, startPct: cumulativePct, color: PALETTE[i % PALETTE.length] };
    cumulativePct += pct;
    return seg;
  });

  // Build conic-gradient string
  let gradientParts: string[] = [];
  for (const seg of segments) {
    gradientParts.push(`${seg.color} ${seg.startPct.toFixed(2)}% ${(seg.startPct + seg.pct).toFixed(2)}%`);
  }
  const gradient = `conic-gradient(${gradientParts.join(", ")})`;

  const hovered = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Donut */}
      <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
        <div
          className="rounded-full"
          style={{
            width: 120,
            height: 120,
            background: gradient,
          }}
        />
        {/* Hole */}
        <div
          className="absolute inset-0 m-auto rounded-full bg-card flex items-center justify-center"
          style={{ width: 56, height: 56 }}
        >
          {hovered ? (
            <div className="text-center px-1">
              <p className="text-[9px] leading-tight text-muted-foreground truncate w-12 text-center">{hovered.label}</p>
              <p className="text-xs font-bold">{hovered.pct.toFixed(0)}%</p>
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground text-center leading-tight">
              {total}<br />total
            </p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 grid grid-cols-1 gap-1 max-h-40 overflow-auto w-full">
        {segments.map((seg, i) => (
          <div
            key={seg.label}
            className={`flex items-center gap-2 text-xs cursor-pointer rounded px-1 py-0.5 transition-colors ${
              hoveredIndex === i ? "bg-muted" : "hover:bg-muted/50"
            }`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span
              className="shrink-0 w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: seg.color }}
            />
            <span className="truncate text-muted-foreground flex-1" title={seg.label}>
              {seg.label}
            </span>
            <span className="tabular-nums font-medium text-foreground shrink-0">
              {seg.value}
            </span>
            <span className="tabular-nums text-muted-foreground shrink-0 w-8 text-right">
              {seg.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
