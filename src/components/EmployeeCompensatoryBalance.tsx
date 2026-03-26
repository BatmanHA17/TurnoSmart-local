import { useCompensatoryTimeOff } from "@/hooks/useCompensatoryTimeOff";

interface EmployeeCompensatoryBalanceProps {
  colaboradorId: string;
  className?: string;
}

export function EmployeeCompensatoryBalance({ colaboradorId, className }: EmployeeCompensatoryBalanceProps) {
  const { balance, loading } = useCompensatoryTimeOff(colaboradorId);

  // For mock employees, show specific test balance
  if (colaboradorId.startsWith('mock-')) {
    // Show some test balances for demo
    const testBalance = colaboradorId === 'mock-1' ? 12 : colaboradorId === 'mock-2' ? 8 : colaboradorId === 'mock-3' ? 5 : 0;
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        Compensar {testBalance}h
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        Compensar ...
      </div>
    );
  }

  // Use real balance from database, if no record exists show 0
  const displayBalance = balance;
  
  return (
    <div className={`text-xs text-muted-foreground ${className}`} style={{ fontSize: '8px' }}>
      Compensar {displayBalance}h
    </div>
  );
}