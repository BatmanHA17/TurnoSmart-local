import { useState } from "react";
import { format } from "date-fns";

interface DailyNotesRowProps {
  days: Date[];
  notes: Record<string, string>;
  onUpdateNote: (date: string, note: string) => Promise<void>;
  canEdit: boolean;
  columnWidth?: string;
}

export const DailyNotesRow = ({
  days,
  notes,
  onUpdateNote,
  canEdit,
  columnWidth = "90px",
}: DailyNotesRowProps) => {
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [draftValue, setDraftValue] = useState<string>("");

  const handleCellClick = (dateKey: string) => {
    if (!canEdit) return;
    setEditingDate(dateKey);
    setDraftValue(notes[dateKey] ?? "");
  };

  const handleBlur = async (dateKey: string) => {
    setEditingDate(null);
    try {
      await onUpdateNote(dateKey, draftValue);
    } catch {
      // error handled by hook
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    dateKey: string
  ) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingDate(null);
      setDraftValue("");
    }
  };

  return (
    <tr className="bg-blue-50/30 dark:bg-blue-950/10 border-b">
      {/* Label cell */}
      <td
        className="sticky left-0 bg-blue-50/30 dark:bg-blue-950/10 z-10 py-1 px-1 border-r w-[90px] min-w-[90px] max-w-[90px]"
        style={{ width: "90px", minWidth: "90px", maxWidth: "90px" }}
      >
        <span className="text-[9px] text-muted-foreground leading-none">
          Notas del día
        </span>
      </td>

      {/* One cell per day */}
      {days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const noteText = notes[dateKey] ?? "";
        const isEditing = editingDate === dateKey;

        return (
          <td
            key={dateKey}
            style={{ width: columnWidth, minWidth: columnWidth, maxWidth: columnWidth }}
            className="py-0.5 px-0.5 border-r align-middle"
            onClick={() => handleCellClick(dateKey)}
          >
            {isEditing ? (
              <input
                autoFocus
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                onBlur={() => handleBlur(dateKey)}
                onKeyDown={(e) => handleKeyDown(e, dateKey)}
                className="w-full text-[9px] bg-white dark:bg-background border border-blue-300 dark:border-blue-700 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-blue-400"
                maxLength={120}
              />
            ) : noteText ? (
              <span
                className={`block text-[9px] text-muted-foreground italic leading-tight truncate${canEdit ? " cursor-pointer" : ""}`}
                title={noteText}
              >
                {noteText}
              </span>
            ) : canEdit ? (
              <span className="block text-[9px] text-muted-foreground/40 cursor-pointer select-none">
                +
              </span>
            ) : null}
          </td>
        );
      })}
    </tr>
  );
};
