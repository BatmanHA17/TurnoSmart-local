import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, CheckCircle, Clock, XCircle } from "lucide-react";

interface EmployeeRequestStats {
  employeeId: string;
  employeeName: string;
  totalRequests: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface RequestsStatsCardProps {
  data: EmployeeRequestStats[];
  loading?: boolean;
}

export function RequestsStatsCard({ data, loading }: RequestsStatsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRequests = data.reduce((acc, emp) => acc + emp.totalRequests, 0);

  if (totalRequests === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Peticiones al manager</CardTitle>
          <CardDescription className="text-sm">Solicitudes realizadas por empleado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Sin peticiones en el período
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          Peticiones al manager
        </CardTitle>
        <CardDescription className="text-sm">{totalRequests} solicitudes en total</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {data.slice(0, 10).map((emp, index) => (
              <div
                key={emp.employeeId}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-5">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-none">{emp.employeeName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {emp.approved > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          {emp.approved}
                        </span>
                      )}
                      {emp.pending > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600">
                          <Clock className="h-3 w-3" />
                          {emp.pending}
                        </span>
                      )}
                      {emp.rejected > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-destructive">
                          <XCircle className="h-3 w-3" />
                          {emp.rejected}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {emp.totalRequests}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
