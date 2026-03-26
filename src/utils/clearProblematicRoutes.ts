// Utility to clean up problematic routes from sessionStorage
export const clearProblematicRoutes = () => {
  try {
    const problematicRoutes = ['/nueva-seccion', '/perfil', '/profile'];
    
    // Check and clear sessionStorage
    const savedRoute = sessionStorage.getItem('lastRoute');
    if (savedRoute && problematicRoutes.some(route => savedRoute.includes(route))) {
      sessionStorage.removeItem('lastRoute');
    }
    
    // Check current URL and redirect if necessary
    const currentPath = window.location.pathname;
    if (problematicRoutes.some(route => currentPath.includes(route))) {
      window.location.replace('/dashboard');
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Error clearing problematic routes:', error);
    return false;
  }
};