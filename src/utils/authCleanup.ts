// Utility to clean corrupted Supabase tokens and prevent auth loops

export const cleanCorruptedTokens = () => {
  
  const keys = Object.keys(localStorage).filter(key => 
    key.includes('sb-') || key.includes('supabase')
  );
  
  if (keys.length === 0) {
    return;
  }
  
  
  // Check if any token seems corrupted (contains error indicators)
  let hasCorruptedTokens = false;
  
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        // Check for common corruption indicators
        if (value.includes('error') || 
            value.includes('invalid') || 
            value.includes('expired') ||
            value.length < 10) {
          hasCorruptedTokens = true;
        }
      }
    } catch (error) {
      hasCorruptedTokens = true;
    }
  });
  
  // If we detect corruption or if there are many auth errors, clean all tokens
  if (hasCorruptedTokens || shouldForceCleanup()) {
    keys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('❌ Failed to remove:', key, error);
      }
    });
    
    // Mark that we cleaned tokens
    sessionStorage.setItem('tokens_cleaned', 'true');
  } else {
  }
};

const shouldForceCleanup = (): boolean => {
  // Check if we've been getting too many auth errors
  const errorCount = sessionStorage.getItem('auth_error_count');
  if (errorCount && parseInt(errorCount) > 5) {
    return true;
  }
  
  // Check if tokens were cleaned recently and we're still having issues
  const tokensCleanedRecently = sessionStorage.getItem('tokens_cleaned');
  if (tokensCleanedRecently) {
    sessionStorage.removeItem('tokens_cleaned');
    return false; // Don't clean again immediately
  }
  
  return false;
};

export const trackAuthError = () => {
  const currentCount = parseInt(sessionStorage.getItem('auth_error_count') || '0');
  sessionStorage.setItem('auth_error_count', (currentCount + 1).toString());
  
  // Clean up error count after some time
  setTimeout(() => {
    sessionStorage.removeItem('auth_error_count');
  }, 60000); // 1 minute
};

export const clearAuthErrorCount = () => {
  sessionStorage.removeItem('auth_error_count');
};