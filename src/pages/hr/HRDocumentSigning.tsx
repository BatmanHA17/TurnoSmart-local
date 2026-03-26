import { useEffect } from "react";
import { HRSidebar } from "@/components/HRSidebar";
import { MainLayout } from "@/components/MainLayout";

export default function HRDocumentSigning() {
  useEffect(() => {
    document.title = "HR Document Signing – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="flex min-h-screen bg-muted/20">
        <HRSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground">Document Signing</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage document signing
              </p>
            </div>
            
            <div className="text-muted-foreground">
              Document signing management pending implementation
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}