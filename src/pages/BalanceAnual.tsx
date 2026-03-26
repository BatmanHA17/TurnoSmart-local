import { MainLayout } from "@/components/MainLayout";
import { AnnualBalanceReportConfig } from "@/components/AnnualBalanceReportConfig";
import { useEffect } from "react";

export default function BalanceAnual() {
  useEffect(() => {
    document.title = "Balance Anual – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <div className="p-6">
        <AnnualBalanceReportConfig />
      </div>
    </MainLayout>
  );
}
