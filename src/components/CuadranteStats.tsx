import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CuadranteMensual, CuadranteEmployee } from "@/types/cuadrante";
import { cn } from "@/lib/utils";

interface CuadranteStatsProps {
  cuadrante: CuadranteMensual;
  className?: string;
}

export function CuadranteStats({ cuadrante, className }: CuadranteStatsProps) {
  const { employees, daysInMonth, occupancy } = cuadrante;

  // Función para calcular todas las estadísticas diarias
  const calculateDayStats = (day: number) => {
    const dayOccupancy = occupancy.find(occ => occ.day === day);
    const ocupacionPorcentaje = dayOccupancy?.occupancyPercentage || 0;

    // Contadores básicos inicializados
    let presencialesDia = 0;
    let presencialesBanquetesDia = 0;
    let cursosAusentes = 0;
    let ettPresenciales = 0;
    let ettBanquetes = 0;
    let libresTotales = 0;
    let vacacionesTotales = 0;
    let enfermosAccidentesTotales = 0;
    let faltaTotales = 0;
    let permisosTotales = 0;
    let horasSindicales = 0;
    let sancionadosTotales = 0;

    employees.forEach(employee => {
      const dayCode = employee.schedule[day];
      const units = employee.contractUnits;
      const isETT = employee.department === 'ETT';

      switch (dayCode) {
        case 'X': // Presencial
          if (isETT) {
            ettPresenciales += units;
          } else {
            presencialesDia += units;
          }
          break;
        case 'XB': // Presencial Banquetes
          if (isETT) {
            ettBanquetes += units;
          } else {
            presencialesBanquetesDia += units;
          }
          break;
        case 'C': // Curso
          cursosAusentes += units;
          break;
        case 'L': // Libre
          libresTotales += units;
          break;
        case 'V': // Vacaciones
          vacacionesTotales += units;
          break;
        case 'E': // Enfermedad
          enfermosAccidentesTotales += units;
          break;
        case 'F': // Falta
          faltaTotales += units;
          break;
        case 'P': // Permiso
          permisosTotales += units;
          break;
        case 'H': // Horas Sindicales
          horasSindicales += units;
          break;
        case 'S': // Sanción
          sancionadosTotales += units;
          break;
      }
    });

    // Cálculos derivados
    const totalETT = ettPresenciales + ettBanquetes;
    const totalPresencialHotelETT = presencialesDia + totalETT;
    const plantillaPresencialLibre = presencialesDia + libresTotales;
    
    // Plantilla bruta
    const totalPlantillaBrutaRealSinETT =
      presencialesDia +
      presencialesBanquetesDia +
      cursosAusentes +
      libresTotales +
      vacacionesTotales +
      enfermosAccidentesTotales +
      faltaTotales +
      permisosTotales +
      horasSindicales +
      sancionadosTotales;
    
    const totalPlantillaBrutaRealConETT = totalPlantillaBrutaRealSinETT + totalETT;

    const totalPlantillaBrutaPPTO = Math.round(ocupacionPorcentaje / 100 * 45); // Estimación
    const diferenciasRealPPTO = totalPlantillaBrutaRealSinETT - totalPlantillaBrutaPPTO;

    // Clientes y ratios
    const numClientes = Math.round((ocupacionPorcentaje / 100) * 1580);
    const totalCamareros = employees.filter(emp => 
      (emp.category.toLowerCase().includes('camarero') || emp.category.toLowerCase().includes('ayudante')) &&
      (emp.schedule[day] === 'X' || emp.schedule[day] === 'XB')
    ).length;
    
    const realClienteCamareros = totalCamareros > 0 ? numClientes / totalCamareros : 0;
    const pptoClienteCamarerosLBA = 49.07;
    const diferenciasClienteCamareros = realClienteCamareros - pptoClienteCamarerosLBA;
    const ocupacionEstancias = ocupacionPorcentaje * 2.3;

    return {
      ocupacionPorcentaje,
      presencialesDia,
      presencialesBanquetesDia,
      cursosAusentes,
      totalPresencialHotelETT,
      ettPresenciales,
      ettBanquetes,
      totalETT,
      libresTotales,
      plantillaPresencialLibre,
      vacacionesTotales,
      enfermosAccidentesTotales,
      faltaTotales,
      permisosTotales,
      horasSindicales,
      sancionadosTotales,
      totalPlantillaBrutaRealSinETT,
      totalPlantillaBrutaRealConETT,
      totalPlantillaBrutaPPTO,
      diferenciasRealPPTO,
      numClientes,
      realClienteCamareros,
      pptoClienteCamarerosLBA,
      pptoClienteCamarerosLBA2: pptoClienteCamarerosLBA,
      diferenciasClienteCamareros,
      ocupacionEstancias,
      pptoClienteCamarerosLCM: 45.5,
      pptoClienteCamarerosLVC: 42.3
    };
  };

  // Calcular estadísticas para todos los días
  const allDaysStats = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    stats: calculateDayStats(i + 1)
  }));

  // Calcular medias mensuales
  const calculateMonthlyAverages = () => {
    const totals = allDaysStats.reduce((acc, { stats }) => {
      Object.keys(stats).forEach(key => {
        acc[key] = (acc[key] || 0) + (stats[key] as number);
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.fromEntries(
      Object.entries(totals).map(([key, value]) => [key, (value as number) / daysInMonth])
    );
  };

  const monthlyAverages = calculateMonthlyAverages();

  const getDayOfWeek = (day: number) => {
    const date = new Date(cuadrante.year, cuadrante.month - 1, day);
    const weekdays = ['D', 'L', 'M', 'MI', 'J', 'V', 'S'];
    return weekdays[date.getDay()];
  };

  // TODAS las 27 filas de estadísticas KPI exactamente como en el CSV
  const statsRows = [
    { label: 'Ocupación (%)', key: 'ocupacionPorcentaje', color: 'bg-notion-blue-bg text-notion-blue-text', marker: 'Haz clic para editar' },
    { label: 'PRESENCIALES DÍA', key: 'presencialesDia', color: 'bg-notion-yellow-bg text-notion-yellow-text', marker: 'Marcar X' },
    { label: 'PRESENCIALES BANQUETES DÍA', key: 'presencialesBanquetesDia', color: 'bg-notion-green-bg text-notion-green-text', marker: 'Marcar XB' },
    { label: 'CURSOS (AUSENTES +4horas dia)', key: 'cursosAusentes', color: 'bg-notion-orange-bg text-notion-orange-text', marker: 'Marcar C' },
    { label: 'TOTAL PRESENCIAL HOTEL + ETT', key: 'totalPresencialHotelETT', color: 'bg-notion-purple-bg text-notion-purple-text', marker: 'TOTAL' },
    { label: 'ETT', key: 'ettPresenciales', color: 'bg-notion-blue-bg text-notion-blue-text', marker: 'Marcar X' },
    { label: 'ETT Banquetes & Eventos', key: 'ettBanquetes', color: 'bg-notion-blue-bg text-notion-blue-text', marker: 'Marcar X' },
    { label: 'TOTAL ETT', key: 'totalETT', color: 'bg-notion-blue-bg text-notion-blue-text', marker: 'Marcar X' },
    { label: 'LibresTotales', key: 'libresTotales', color: 'bg-notion-gray-bg text-notion-gray-text', marker: 'Marcar L' },
    { label: 'Plantilla Presencial + Libre', key: 'plantillaPresencialLibre', color: 'bg-notion-green-bg text-notion-green-text', marker: '"Activos"' },
    { label: 'Vacaciones Totales', key: 'vacacionesTotales', color: 'bg-notion-blue-bg text-notion-blue-text', marker: 'Marcar V' },
    { label: 'Enfermos /Accidentes Totales', key: 'enfermosAccidentesTotales', color: 'bg-notion-red-bg text-notion-red-text', marker: 'Marcar E' },
    { label: 'Falta Totales', key: 'faltaTotales', color: 'bg-notion-red-bg text-notion-red-text', marker: 'Marcar F' },
    { label: 'Permisos Totales', key: 'permisosTotales', color: 'bg-notion-purple-bg text-notion-purple-text', marker: 'Marcar P' },
    { label: 'Horas Sindicales Totales', key: 'horasSindicales', color: 'bg-notion-gray-bg text-notion-gray-text', marker: 'Marcar H' },
    { label: 'Sancionados Totales', key: 'sancionadosTotales', color: 'bg-notion-pink-bg text-notion-pink-text', marker: 'Marcar S' },
    { label: 'TOTAL PLANTILLA BRUTA REAL', key: 'totalPlantillaBrutaRealSinETT', color: 'bg-notion-yellow-bg text-notion-yellow-text', marker: '(sin EETT)' },
    { label: 'TOTAL PLANTILLA BRUTA REAL', key: 'totalPlantillaBrutaRealConETT', color: 'bg-notion-yellow-bg text-notion-yellow-text', marker: '(CON EETT)' },
    { label: 'TOTAL PLANTILLA BRUTA PPTO', key: 'totalPlantillaBrutaPPTO', color: 'bg-notion-gray-bg text-notion-gray-text', marker: '' },
    { label: 'DIFERECIAS SOBRE REAL - PPTO', key: 'diferenciasRealPPTO', color: 'bg-notion-orange-bg text-notion-orange-text', marker: '' },
    { label: 'Nº CLIENTES', key: 'numClientes', color: 'bg-notion-green-bg text-notion-green-text', marker: '' },
    { label: '', key: 'separatorBlack', color: 'bg-foreground text-background', marker: '' },
    { label: 'REAL CLIENTE/CAMAREROS', key: 'realClienteCamareros', color: 'bg-notion-blue-bg text-notion-blue-text', marker: '' },
    { label: 'PPTO CLIENTES/CAMAREROS LBA', key: 'pptoClienteCamarerosLBA', color: 'bg-notion-blue-bg text-notion-blue-text', marker: '' },
    { label: 'DIFERENCIAS SOBRE PPTO', key: 'diferenciasClienteCamareros', color: 'bg-notion-pink-bg text-notion-pink-text', marker: '' },
    { label: 'OCUPACION (%): ESTANCIAS x 2,3', key: 'ocupacionEstancias', color: 'bg-notion-purple-bg text-notion-purple-text', marker: '' },
  ];

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Estadísticas del Cuadrante</span>
          <Badge variant="outline">
            {cuadrante.month}/{cuadrante.year}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Tabla de estadísticas diarias */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header con conceptos */}
              <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: `250px repeat(${daysInMonth}, 50px) 70px` }}>
                <div className="font-medium text-sm text-muted-foreground p-2 border border-gray-300 bg-gray-50">
                  Concepto
                </div>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <div key={i + 1} className="text-center text-xs font-medium p-1 border border-gray-300 bg-blue-50">
                    {getDayOfWeek(i + 1)}
                  </div>
                ))}
                <div className="text-center text-xs font-medium p-1 border border-gray-300 bg-primary text-primary-foreground">
                  Media
                </div>
              </div>

              {/* Header con números de días */}
              <div className="grid gap-1 mb-3" style={{ gridTemplateColumns: `250px repeat(${daysInMonth}, 50px) 70px` }}>
                <div className="border border-gray-300 bg-gray-50"></div>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <div key={i + 1} className="text-center text-xs font-bold p-1 border border-gray-300 bg-blue-50">
                    {i + 1}
                  </div>
                ))}
                <div className="border border-gray-300 bg-gray-50"></div>
              </div>

              {/* Porcentajes de ocupación */}
              <div className="grid gap-1 mb-3" style={{ gridTemplateColumns: `250px repeat(${daysInMonth}, 50px) 70px` }}>
                <div className="border border-gray-300 bg-gray-50"></div>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dayOcc = occupancy.find(occ => occ.day === i + 1);
                  return (
                    <div key={i + 1} className="text-center text-xs p-1 border border-gray-300 bg-blue-50">
                      {dayOcc ? `${dayOcc.occupancyPercentage.toFixed(0)}%` : '0%'}
                    </div>
                  );
                })}
                <div className="text-center text-xs p-1 border border-gray-300 bg-primary text-primary-foreground">
                  {(monthlyAverages.ocupacionPorcentaje || 0).toFixed(2)}%
                </div>
              </div>

              {/* Filas de estadísticas */}
              {statsRows.map((row, index) => (
                <div key={`${row.key}-${index}`} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `250px repeat(${daysInMonth}, 50px) 70px` }}>
                  <div className={cn("text-sm font-medium p-2 border border-gray-300 flex items-center justify-between", row.color)}>
                    <span>{row.label}</span>
                    {row.marker && (
                      <span className="text-xs text-muted-foreground ml-2">{row.marker}</span>
                    )}
                  </div>
                  {allDaysStats.map(({ day, stats }) => (
                    <div key={day} className={cn("text-center text-xs p-1 border border-gray-300", row.color)}>
                      {row.key === 'separatorBlack' ? '' : 
                        (typeof stats[row.key] === 'number' 
                          ? (row.key.includes('ocupacion') && row.key !== 'ocupacionEstancias'
                            ? `${stats[row.key].toFixed(2)}%`
                            : stats[row.key].toFixed(2)
                          )
                          : '0.00'
                        )
                      }
                    </div>
                  ))}
                  <div className={cn("text-center text-xs font-bold p-1 border border-gray-300", row.color)}>
                    {row.key === 'separatorBlack' ? '' :
                      (typeof monthlyAverages[row.key] === 'number'
                        ? (row.key.includes('ocupacion') && row.key !== 'ocupacionEstancias'
                          ? `${monthlyAverages[row.key].toFixed(2)}%`
                          : monthlyAverages[row.key].toFixed(2)
                        )
                        : '0.00'
                      )
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen mensual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Personal Presencial</h4>
              <div className="text-2xl font-bold text-notion-green-text">
                {(monthlyAverages.presencialesDia || 0).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Media diaria</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Ocupación Media</h4>
              <div className="text-2xl font-bold text-notion-blue-text">
                {(monthlyAverages.ocupacionPorcentaje || 0).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Del hotel</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Absentismo</h4>
              <div className="text-2xl font-bold text-notion-red-text">
                {((monthlyAverages.enfermosAccidentesTotales || 0) + (monthlyAverages.faltaTotales || 0)).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Enfermedad + Faltas</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Personal ETT</h4>
              <div className="text-2xl font-bold text-notion-orange-text">
                {(monthlyAverages.totalETT || 0).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Media diaria</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}