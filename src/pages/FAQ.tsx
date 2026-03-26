import { MainLayout } from "@/components/MainLayout";
import { ShiftManagementFAQ } from "@/components/ShiftManagementFAQ";
import { useEffect } from "react";

export default function FAQ() {
  useEffect(() => {
    document.title = "Preguntas Frecuentes – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6">
        <ShiftManagementFAQ />
      </div>
    </MainLayout>
  );
}
