import { parseHMSSafe } from "@/utils/time";

interface HourScaleProps {
  shifts: Array<{
    start_time: string | null;
    end_time: string | null;
    employee_id: string;
  }>;
  currentHour?: number;
  title?: string;
}

/**
 * Calcula cuántas personas únicas trabajan en cada franja horaria [h:00, h+1:00)
 * Soporta cruces de medianoche y valores null (descansos no suman)
 */
function calculateHourBuckets(
  shifts: Array<{ start_time: string | null; end_time: string | null; employee_id: string }>
): number[] {
  const buckets = new Array(24).fill(0).map(() => new Set<string>());

  for (const shift of shifts) {
    if (!shift.start_time || !shift.end_time) continue; // Skip descansos

    const start = parseHMSSafe(shift.start_time);
    const end = parseHMSSafe(shift.end_time);

    if (!start || !end) continue;

    let startHour = start.h;
    let endHour = end.h;

    // Handle midnight crossing
    if (endHour < startHour || (endHour === startHour && end.m === 0)) {
      endHour += 24;
    }

    // If end minute is 0, don't count that hour
    const lastHour = end.m === 0 ? endHour : endHour + 1;

    // Add employee to all hour buckets they work in
    for (let h = startHour; h < lastHour; h++) {
      const hourIndex = h % 24;
      buckets[hourIndex].add(shift.employee_id);
    }
  }

  return buckets.map(set => set.size);
}

/**
 * HourScale: Ruler con ticks horarios + pills con conteo de personas
 * Alineado 1:1 con el timeline usando posiciones absolutas en %
 */
export function HourScale({ shifts, currentHour, title }: HourScaleProps) {
  const hourBuckets = calculateHourBuckets(shifts);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const pad2 = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="space-y-1">
      {title && (
        <h3 className="text-sm font-medium text-foreground/80">{title}</h3>
      )}
      
      {/* Ruler: ticks + labels (24h) */}
      <div className="relative h-6 w-full">
        {hours.map(h => {
          const leftPercent = (h / 24) * 100;
          const isCurrentHour = currentHour !== undefined && currentHour === h;

          return (
            <div
              key={h}
              className="absolute top-0"
              style={{ left: `${leftPercent}%` }}
            >
              {/* Tick vertical */}
              <div
                className={`w-px h-3 ${
                  isCurrentHour ? 'bg-foreground/40' : 'bg-border/50'
                }`}
              />
              {/* Hour label */}
              <div
                className={`absolute left-0 top-3 -translate-x-1/2 text-[9px] tabular-nums select-none ${
                  isCurrentHour
                    ? 'text-foreground/70 font-medium'
                    : 'text-muted-foreground/60'
                }`}
              >
                {pad2(h)}:00
              </div>
            </div>
          );
        })}
      </div>

      {/* Pills row: conteo de personas por hora */}
      <div className="relative h-6 w-full">
        {hourBuckets.map((count, h) => {
          // Center pill in the middle of the hour slot
          const centerPercent = ((h + 0.5) / 24) * 100;
          const isCurrentHour = currentHour !== undefined && currentHour === h;

          return (
            <div
              key={h}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${centerPercent}%` }}
            >
              <div
                className={`
                  h-5 w-5 rounded-full flex items-center justify-center
                  text-white text-[10px] font-normal bg-gray-700 opacity-80
                  transition-all
                  ${isCurrentHour ? 'opacity-100' : ''}
                `}
                title={`${pad2(h)}:00–${pad2((h + 1) % 24)}:00 • ${count} persona${
                  count !== 1 ? 's' : ''
                }`}
              >
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
