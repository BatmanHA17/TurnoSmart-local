import { STATUS_CODES } from "@/constants/cuadrante";

export function CuadranteLegend() {
  return (
    <div className="bg-card rounded-lg border border-border/30 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_CODES.map(status => (
            <div
              key={status.code}
              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${status.color}`}
            >
              {status.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
