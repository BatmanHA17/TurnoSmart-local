import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HRSidebar } from "@/components/HRSidebar";

export default function HR() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to HR home when accessing /hr directly
    navigate("/hr/home", { replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-muted/20">
      <HRSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-muted-foreground">Redirigiendo al resumen de HR...</p>
          </div>
        </div>
      </div>
    </div>
  );
}