import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Sun, Sunset, Moon } from "lucide-react";
import { ShiftTimeDistribution } from "@/utils/shiftAnalytics";

interface ShiftTimesTableProps {
  data: ShiftTimeDistribution[];
  loading?: boolean;
}

export function ShiftTimesTable({ data, loading }: ShiftTimesTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totals = data.reduce(
    (acc, row) => ({
      mananas: acc.mananas + row.mananas,
      tardes: acc.tardes + row.tardes,
      noches: acc.noches + row.noches,
      total: acc.total + row.mananas + row.tardes + row.noches,
    }),
    { mananas: 0, tardes: 0, noches: 0, total: 0 }
  );

  // Sort by total shifts
  const sortedData = [...data].sort((a, b) => 
    (b.mananas + b.tardes + b.noches) - (a.mananas + a.tardes + a.noches)
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Mañanas / Tardes / Noches
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[280px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-[10px]">
                <TableHead className="sticky left-0 bg-card z-10 w-24 text-xs">Empleado</TableHead>
                <TableHead className="text-center px-2">
                  <div className="flex items-center justify-center gap-1">
                    <Sun className="h-3 w-3 text-amber-500" />
                    <span>M</span>
                  </div>
                </TableHead>
                <TableHead className="text-center px-2">
                  <div className="flex items-center justify-center gap-1">
                    <Sunset className="h-3 w-3 text-orange-500" />
                    <span>T</span>
                  </div>
                </TableHead>
                <TableHead className="text-center px-2">
                  <div className="flex items-center justify-center gap-1">
                    <Moon className="h-3 w-3 text-indigo-500" />
                    <span>N</span>
                  </div>
                </TableHead>
                <TableHead className="text-center px-2 font-semibold">Tot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, index) => {
                const total = row.mananas + row.tardes + row.noches;
                return (
                  <TableRow key={index} className="text-xs">
                    <TableCell className="sticky left-0 bg-card z-10 font-medium truncate max-w-24 py-1.5">
                      {row.employeeName.split(' ')[0]}
                    </TableCell>
                    <TableCell className="text-center py-1.5 px-2">
                      <span className="text-amber-600 font-medium">{row.mananas || '-'}</span>
                    </TableCell>
                    <TableCell className="text-center py-1.5 px-2">
                      <span className="text-orange-600 font-medium">{row.tardes || '-'}</span>
                    </TableCell>
                    <TableCell className="text-center py-1.5 px-2">
                      <span className="text-indigo-600 font-medium">{row.noches || '-'}</span>
                    </TableCell>
                    <TableCell className="text-center py-1.5 px-2 font-semibold">{total}</TableCell>
                  </TableRow>
                );
              })}
              {/* Totals row */}
              <TableRow className="bg-muted/50 font-semibold text-xs">
                <TableCell className="sticky left-0 bg-muted/50 z-10 py-1.5">Total</TableCell>
                <TableCell className="text-center py-1.5 px-2 text-amber-600">{totals.mananas}</TableCell>
                <TableCell className="text-center py-1.5 px-2 text-orange-600">{totals.tardes}</TableCell>
                <TableCell className="text-center py-1.5 px-2 text-indigo-600">{totals.noches}</TableCell>
                <TableCell className="text-center py-1.5 px-2">{totals.total}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
