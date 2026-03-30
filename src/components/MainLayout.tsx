import { HorizontalNav } from "@/components/HorizontalNav";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { MobileBottomNav } from "@/components/MobileBottomNav";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {/* Horizontal Navigation */}
      <HorizontalNav />

      {/* Main Content — extra bottom padding on mobile so content isn't hidden behind the bottom nav */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}