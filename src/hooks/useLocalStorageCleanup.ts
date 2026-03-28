import { useEffect } from 'react';

/**
 * Hook that clears all stale localStorage keys on app initialization.
 * This implements "km 0" - clean slate with no cached data.
 */
export function useLocalStorageCleanup() {
  useEffect(() => {
    // List of ALL localStorage keys used by TurnoSmart
    // Removing all of them ensures km 0 clean state
    const keysToRemove = [
      // Shift/calendar data
      'turnosmart_configuration',
      'calendar-employees',
      'calendar-shift-blocks',
      'calendar-shifts-backup-timestamp',
      'calendar_shifts_backup',
      'calendar-sort-criteria',
      'calendar-employee-sort-criteria',
      'calendar-employee-exclusions',

      // Leave/absence requests
      'gestion-jornada-periods',
      'leaveRequests',
      'absenceRequests',
      'processed-leave-requests',
      'absenceRequestsCleaned',

      // Saved shifts
      'saved-shifts-updated',
      'turnosmart-favorite-shifts',

      // Employee selection
      'selectedEmployeesForCalendar',
      'updatedEmployeeForCalendar',
      'manual-employee-order',

      // Legacy/deprecated keys
      'old_shifts_data',
      'old_employees_data',
      'dev_mode_settings'
    ];

    // Clear each key
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        // Silently ignore errors (e.g., private browsing mode)
        console.debug(`Could not remove localStorage key: ${key}`);
      }
    });
  }, []);
}
