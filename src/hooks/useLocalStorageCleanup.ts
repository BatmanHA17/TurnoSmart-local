import { useEffect } from 'react';

/**
 * Hook that clears stale/legacy localStorage keys on app initialization.
 * Only removes truly temporary cache data — NOT user preferences or favorites.
 */
export function useLocalStorageCleanup() {
  useEffect(() => {
    // Only remove temporary cache and legacy keys
    // DO NOT remove user-configured data (favorites, employee order, selection)
    const keysToRemove = [
      // Temporary shift cache (real data lives in Supabase)
      'turnosmart_configuration',
      'calendar-shift-blocks',
      'calendar-shifts-backup-timestamp',
      'calendar_shifts_backup',

      // Legacy leave/absence cache
      'gestion-jornada-periods',
      'leaveRequests',
      'absenceRequests',
      'processed-leave-requests',
      'absenceRequestsCleaned',

      // Stale flags
      'saved-shifts-updated',

      // Legacy/deprecated keys
      'old_shifts_data',
      'old_employees_data',
      'dev_mode_settings'
    ];

    // PRESERVED (user preferences, persist across navigation):
    // - 'turnosmart-favorite-shifts'  (Q1 fix: favorites must persist)
    // - 'manual-employee-order'       (T1-8: persistent sort order)
    // - 'selectedEmployeesForCalendar' (employee selection)
    // - 'calendar-employees'          (employee list cache)
    // - 'calendar-sort-criteria'      (sort preference)
    // - 'calendar-employee-sort-criteria'
    // - 'calendar-employee-exclusions'
    // - 'updatedEmployeeForCalendar'

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Silently ignore errors (e.g., private browsing mode)
      }
    });
  }, []);
}
