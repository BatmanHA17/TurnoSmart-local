import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onUndo: () => void;
  onRedo: () => void;
  onSave?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  enabled = true,
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

      // Ignorar si está escribiendo en un input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl/Cmd + Z → Undo
      if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        onUndo();
        return;
      }

      // Ctrl/Cmd + Y → Redo (Windows/Linux)
      // Ctrl/Cmd + Shift + Z → Redo (Mac alternativo)
      if (
        (isCtrlOrCmd && event.key === 'y') ||
        (isCtrlOrCmd && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        onRedo();
        return;
      }

      // Ctrl/Cmd + S → Force Save
      if (isCtrlOrCmd && event.key === 's' && onSave) {
        event.preventDefault();
        onSave();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onSave, enabled]);
}
