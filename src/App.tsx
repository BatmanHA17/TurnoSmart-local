import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { AppRoutes } from "@/components/AppRoutes";
import { useLocalStorageCleanup } from "@/hooks/useLocalStorageCleanup";

const queryClient = new QueryClient();

/**
 * Inner app component that uses hooks requiring auth context
 */
function AppContent() {
  // Clean localStorage on app init (km 0 cleanup)
  useLocalStorageCleanup();

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppRoutes />
    </TooltipProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
