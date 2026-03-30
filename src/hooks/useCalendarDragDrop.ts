import { useState, useCallback } from "react";

/**
 * useCalendarDragDrop
 *
 * Tracks modifier-key state during a drag operation so the BiWeeklyCalendarView
 * can distinguish "move" from "copy" without relying on the DragDropZones overlay.
 *
 * The actual drag-state (isDragging, dragOverCell, hoveredZone, etc.) lives in
 * BiWeeklyCalendarView.  This hook only exposes the copy-mode flag and the
 * helpers to update it, keeping the hook lightweight and non-duplicative.
 */
export function useCalendarDragDrop() {
  /** true when Alt or Ctrl is held while dragging over a calendar cell */
  const [isDragCopyMode, setIsDragCopyMode] = useState(false);

  /**
   * Call this inside the cell's onDragOver handler.
   * Updates the copy-mode flag from the current modifier keys.
   */
  const updateCopyMode = useCallback((e: React.DragEvent) => {
    const copyMode = e.altKey || e.ctrlKey;
    setIsDragCopyMode(copyMode);
    e.dataTransfer.dropEffect = copyMode ? "copy" : "move";
  }, []);

  /** Reset copy-mode (call on dragend or when dragging leaves the grid) */
  const resetCopyMode = useCallback(() => {
    setIsDragCopyMode(false);
  }, []);

  return {
    isDragCopyMode,
    updateCopyMode,
    resetCopyMode,
  };
}
