import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { WeekdayDistribution } from "@/utils/shiftAnalytics";

interface WeekdayDistributionTableProps {
  data: WeekdayDistribution[];
  loading?: boolean;
}

export function WeekdayDistributionTable({ data, loading }: WeekdayDistributionTableProps) {
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
      lunes: acc.lunes + row.lunes,
      martes: acc.martes + row.martes,
      miercoles: acc.miercoles + row.miercoles,
      jueves: acc.jueves + row.jueves,
      viernes: acc.viernes + row.viernes,
      sabado: acc.sabado + row.sabado,
      domingo: acc.domingo + row.domingo,
      total: acc.total + row.total,
    }),
    { lunes: 0, martes: 0, miercoles: 0, jueves: 0, viernes: 0, sabado: 0, domingo: 0, total: 0 }
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Distribución por Día
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[280px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-[10px]">
                <TableHead className="sticky left-0 bg-card z-10 w-24 text-xs">Empleado</TableHead>
                <TableHead className="text-center w-8 px-1">L</TableHead>
                <TableHead className="text-center w-8 px-1">M</TableHead>
                <TableHead className="text-center w-8 px-1">X</TableHead>
                <TableHead className="text-center w-8 px-1">J</TableHead>
                <TableHead className="text-center w-8 px-1">V</TableHead>
                <TableHead className="text-center w-8 px-1 bg-muted/30">S</TableHead>
                <TableHead className="text-center w-8 px-1 bg-muted/30">D</TableHead>
                <TableHead className="text-center w-10 px-1 font-semibold">Tot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} className="text-xs">
                  <TableCell className="sticky left-0 bg-card z-10 font-medium truncate max-w-24 py-1.5">
                    {row.employeeName.split(' ')[0]}
                  </TableCell>
                  <TableCell className="text-center py-1.5 px-1">{row.lunes || '-'}</TableCell>
                  <TableCell className="text-center py-1.5 px-1">{row.martes || '-'}</TableCell>
                  <TableCell className="text-center py-1.5 px-1">{row.miercoles || '-'}</TableCell>
                  <TableCell className="text-center py-1.5 px-1">{row.jueves || '-'}</TableCell>
                  <TableCell className="text-center py-1.5 px-1">{row.viernes || '-'}</TableCell>
                  <TableCell className="text-center py-1.5 px-1 bg-muted/20">{row.sabado || '-'}</TableCell>
                  <TableCell className="text-center py-1.5 px-1 bg-muted/20">{row.domingo || '-'}</TableCell>
                  <TableCell className="text-center py-1.5 px-1 font-semibold">{row.total}</TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="bg-muted/50 font-semibold text-xs">
                <TableCell className="sticky left-0 bg-muted/50 z-10 py-1.5">Total</TableCell>
                <TableCell className="text-center py-1.5 px-1">{totals.lunes}</TableCell>
                <TableCell className="text-center py-1.5 px-1">{totals.martes}</TableCell>
                <TableCell className="text-center py-1.5 px-1">{totals.miercoles}</TableCell>
                <TableCell className="text-center py-1.5 px-1">{totals.jueves}</TableCell>
                <TableCell className="text-center py-1.5 px-1">{totals.viernes}</TableCell>
                <TableCell className="text-center py-1.5 px-1 bg-muted/30">{totals.sabado}</TableCell>
                <TableCell className="text-center py-1.5 px-1 bg-muted/30">{totals.domingo}</TableCell>
                <TableCell className="text-center py-1.5 px-1">{totals.total}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
