import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarX } from "lucide-react";
import { AbsenceByType } from "@/utils/shiftAnalytics";

interface AbsencesByTypeTableProps {
  data: AbsenceByType[];
  loading?: boolean;
}

export function AbsencesByTypeTable({ data, loading }: AbsencesByTypeTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarX className="h-4 w-4 text-muted-foreground" />
          Ausencias por Tipo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="text-[10px]">
              <TableHead className="w-8 px-2">Cód</TableHead>
              <TableHead className="text-xs">Tipo</TableHead>
              <TableHead className="text-center w-12 px-2">Días</TableHead>
              <TableHead className="text-center w-14 px-2">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => {
              const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
              return (
                <TableRow key={index} className="text-xs">
                  <TableCell className="py-1.5 px-2">
                    <div 
                      className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.type}
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5 font-medium">{item.label}</TableCell>
                  <TableCell className="text-center py-1.5 px-2 font-semibold">{item.count}</TableCell>
                  <TableCell className="text-center py-1.5 px-2 text-muted-foreground">{percentage}%</TableCell>
                </TableRow>
              );
            })}
            {/* Total row */}
            {data.length > 0 && (
              <TableRow className="bg-muted/50 font-semibold text-xs">
                <TableCell colSpan={2} className="py-1.5 px-2">Total</TableCell>
                <TableCell className="text-center py-1.5 px-2">{total}</TableCell>
                <TableCell className="text-center py-1.5 px-2">100%</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
