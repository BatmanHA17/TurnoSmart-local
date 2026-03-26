// Utility function to clean all absence requests data
export const cleanAllAbsenceRequests = () => {
  try {
    // Clear all localStorage data related to absence requests
    localStorage.removeItem('absenceRequests');
    localStorage.removeItem('leaveRequests');
    
    // Mark that the database has been manually cleaned
    localStorage.setItem('absenceRequestsCleaned', 'true');
    
    // Dispatch events to notify all components of the cleanup
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'absenceRequests',
      newValue: null
    }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'leaveRequests', 
      newValue: null
    }));
    
    window.dispatchEvent(new CustomEvent('absenceRequestsUpdated'));
    window.dispatchEvent(new CustomEvent('leaveRequestsUpdated'));
    window.dispatchEvent(new CustomEvent('forceEmployeeAbsenceUpdate'));
    window.dispatchEvent(new CustomEvent('forceLeaveRequestUpdate'));
    
    return true;
  } catch (error) {
    console.error('❌ Error cleaning absence requests data:', error);
    return false;
  }
};

// Function to reset to a clean state with no sample data
export const resetAbsenceRequestsToCleanState = () => {
  cleanAllAbsenceRequests();
  
  // Initialize with empty arrays
  localStorage.setItem('absenceRequests', JSON.stringify([]));
  localStorage.setItem('leaveRequests', JSON.stringify([]));
  
};