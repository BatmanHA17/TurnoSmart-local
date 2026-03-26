// Utility to protect Supabase localStorage keys from being accidentally deleted

let originalRemoveItem: typeof localStorage.removeItem;
let originalClear: typeof localStorage.clear;
let isProtectionEnabled = false;
let isLegitimateLogout = false;

export const enableSupabaseStorageProtection = () => {
  if (isProtectionEnabled) return;
  
  console.log('🔒 Enabling Supabase storage protection');
  
  // Store original methods
  originalRemoveItem = localStorage.removeItem.bind(localStorage);
  originalClear = localStorage.clear.bind(localStorage);
  
  // Override removeItem to protect Supabase keys (except during legitimate logout)
  localStorage.removeItem = function(key: string) {
    if ((key.includes('supabase') || key.includes('sb-')) && !isLegitimateLogout) {
      console.warn('🚫 BLOCKED: Attempt to remove Supabase key:', key);
      console.trace();
      // NO ALERT - solo log para no bloquear la interfaz
      return;
    }
    
    // Allow removal during legitimate logout or non-Supabase keys
    if (isLegitimateLogout && (key.includes('supabase') || key.includes('sb-'))) {
      console.log('✅ ALLOWED: Legitimate logout removing Supabase key:', key);
    }
    
    return originalRemoveItem(key);
  };
  
  // Override clear to protect Supabase keys (except during legitimate logout)
  localStorage.clear = function() {
    if (!isLegitimateLogout) {
      console.warn('🚫 BLOCKED: Attempt to clear localStorage completely');
      console.trace();
      
      // NO ALERT - solo log para no bloquear la interfaz
      
      // Instead of clearing everything, only clear non-Supabase keys
      const supabaseKeys: { [key: string]: string } = {};
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          supabaseKeys[key] = localStorage.getItem(key) || '';
        }
      });
      
      originalClear();
      
      // Restore Supabase keys
      Object.entries(supabaseKeys).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
      
      console.log('🔒 Protected Supabase keys restored after clear:', Object.keys(supabaseKeys));
    } else {
      // Allow clear during legitimate logout
      console.log('✅ ALLOWED: Legitimate logout clearing localStorage');
      originalClear();
    }
  };
  
  isProtectionEnabled = true;
};

export const disableSupabaseStorageProtection = () => {
  if (!isProtectionEnabled) return;
  
  console.log('🔓 Disabling Supabase storage protection');
  
  // Restore original methods
  localStorage.removeItem = originalRemoveItem;
  localStorage.clear = originalClear;
  
  isProtectionEnabled = false;
};

export const logSupabaseKeys = () => {
  const supabaseKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  console.log('🔑 Current Supabase keys in localStorage:', supabaseKeys);
  return supabaseKeys;
};

// Functions to control legitimate logout
export const enableLegitimateLogout = () => {
  console.log('🟢 Enabling legitimate logout mode');
  isLegitimateLogout = true;
};

export const disableLegitimateLogout = () => {
  console.log('🔴 Disabling legitimate logout mode');
  isLegitimateLogout = false;
};

// Monitor localStorage for Supabase key changes
let monitorInterval: NodeJS.Timeout | null = null;
let lastSupabaseKeys: string[] = [];

export const startSupabaseKeyMonitoring = () => {
  if (monitorInterval) return;
  
  console.log('👁️ Starting Supabase key monitoring');
  
  const checkKeys = () => {
    const currentKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-')
    );
    
    // Check if keys were removed
    const removedKeys = lastSupabaseKeys.filter(key => !currentKeys.includes(key));
    if (removedKeys.length > 0) {
      console.error('🚨 SUPABASE KEYS REMOVED FROM LOCALSTORAGE:', removedKeys);
      console.error('🚨 Previous keys:', lastSupabaseKeys);
      console.error('🚨 Current keys:', currentKeys);
      console.trace('Stack trace when keys were detected as missing:');
      
      // NO ALERT - solo log para no bloquear la interfaz
    }
    
    // Check if new keys were added
    const newKeys = currentKeys.filter(key => !lastSupabaseKeys.includes(key));
    if (newKeys.length > 0) {
      console.log('✅ NEW SUPABASE KEYS ADDED:', newKeys);
    }
    
    lastSupabaseKeys = [...currentKeys];
  };
  
  // Initial check
  lastSupabaseKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  
  // Check every 1 second
  monitorInterval = setInterval(checkKeys, 1000);
};

export const stopSupabaseKeyMonitoring = () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('👁️ Stopped Supabase key monitoring');
  }
};