import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CuadranteMensual as CuadranteMensualType, CuadranteEmployee } from "@/types/cuadrante";
import { employees as baseEmployees } from "@/data/employees";
import { 
  Calendar, 
  Upload, 
  Download, 
  Settings,
  FileText,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Edit2,
  X,
  Plus,
  MousePointer,
  UserPlus,
  Import,
  Users
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getCuadrantes, upsertCuadrante } from "@/store/cuadrantesStore";
import { getCuadranteData, upsertCuadranteData } from "@/store/cuadranteDataStore";
import { ImportCSVDialog } from './ImportCSVDialog';
import { CuadranteStats } from '@/components/CuadranteStats';
import { useAutoSave } from '@/hooks/useAutoSave';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const YEARS = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

// Códigos de estado disponibles - Notion-inspired monochrome
const statusCodes = [
  { code: 'X', label: 'X - Presencial', color: 'bg-foreground/5 text-foreground border-foreground/10' },
  { code: 'L', label: 'L - Libre', color: 'bg-muted text-muted-foreground border-border' },
  { code: 'V', label: 'V - Vacaciones', color: 'bg-foreground/8 text-foreground border-foreground/15' },
  { code: 'E', label: 'E - Enfermedad', color: 'bg-foreground/10 text-foreground border-foreground/20' },
  { code: 'F', label: 'F - Falta', color: 'bg-foreground/7 text-foreground border-foreground/12' },
  { code: 'P', label: 'P - Permiso', color: 'bg-foreground/6 text-foreground border-foreground/11' },
  { code: 'C', label: 'C - Curso', color: 'bg-foreground/9 text-foreground border-foreground/16' },
  { code: 'H', label: 'H - Horas Sindicales', color: 'bg-foreground/4 text-foreground border-foreground/9' },
  { code: 'S', label: 'S - Sanción', color: 'bg-foreground/12 text-foreground border-foreground/22' },
  { code: 'XB', label: 'XB - Banquetes', color: 'bg-foreground/11 text-foreground border-foreground/18' }
];

const getStatusColor = (code: string) => {
  const status = statusCodes.find(s => s.code === code);
  return status ? status.color : 'bg-muted text-muted-foreground border-border';
};

export function CuadranteEditor({ selectedCuadranteId, readOnly = false, onBack }: { selectedCuadranteId?: string | null; readOnly?: boolean; onBack?: () => void }) {
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [cuadranteName, setCuadranteName] = useState<string>('');
  const [currentCuadrante, setCurrentCuadrante] = useState<CuadranteMensualType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contractFilter, setContractFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'mes' | 'semana1' | 'semana2' | 'semana3' | 'semana4'>('mes');
  const [showOccupancy, setShowOccupancy] = useState<boolean>(true);
  const [showStats, setShowStats] = useState<boolean>(true);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{employeeId: string, day: number} | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState({
    name: '',
    surname: '',
    category: '',
    contractHours: 8,
    department: 'PROPIO' as 'PROPIO' | 'ETT'
  });
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [pendingClearAction, setPendingClearAction] = useState<'mes' | 'semana1' | 'semana2' | 'semana3' | 'semana4' | null>(null);

  // Flag to prevent re-initialization after import
  const skipInitRef = React.useRef(false);

  // Generar nombre automático del cuadrante
  useEffect(() => {
    const monthName = MONTHS[selectedMonth - 1];
    setCuadranteName(`${monthName} ${selectedYear}`);
  }, [selectedMonth, selectedYear]);

  // Inicializar cuadrante cuando cambian mes/año o se selecciona un cuadrante específico
  useEffect(() => {
    if (skipInitRef.current) {
      skipInitRef.current = false;
      return;
    }
    
    if (selectedCuadranteId) {
      // Cargar cuadrante específico desde el store
      loadSpecificCuadrante(selectedCuadranteId);
    } else {
      initializeCuadrante();
    }
  }, [selectedMonth, selectedYear, selectedCuadranteId]);

  // Manejar ESC para cerrar celdas de edición
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEditingCell(null);
        setEditingEmployee(null);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-editing-cell]') && !target.closest('[data-select-content]')) {
        setEditingCell(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadSpecificCuadrante = (cuadranteId: string) => {
    setIsLoading(true);

    // Intentar cargar datos completos del cuadrante desde el store de datos
    const full = getCuadranteData(cuadranteId);
    if (full) {
      setSelectedMonth(full.month);
      setSelectedYear(full.year);
      setCuadranteName(full.name);
      setCurrentCuadrante(full);
      setIsLoading(false);
      toast({
        title: "Cuadrante cargado",
        description: `${full.name} ha sido cargado exitosamente`,
      });
      return;
    }
    
    // Si no hay datos completos, usar el summary para ajustar periodo y crear base
    const cuadrantes = getCuadrantes();
    const cuadranteSummary = cuadrantes.find(c => c.id === cuadranteId);
    
    if (cuadranteSummary) {
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const monthIndex = monthNames.indexOf(cuadranteSummary.month);
      if (monthIndex !== -1) {
        setSelectedMonth(monthIndex + 1);
        setSelectedYear(cuadranteSummary.year);
        setCuadranteName(`${monthNames[monthIndex]} ${cuadranteSummary.year}`);
      }
      setTimeout(() => {
        initializeCuadrante();
        toast({
          title: "Cuadrante cargado",
          description: `${cuadranteSummary.name} ha sido cargado exitosamente`,
        });
      }, 100);
    } else {
      initializeCuadrante();
      toast({
        title: "Cuadrante no encontrado",
        description: "Se ha creado un nuevo cuadrante",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const initializeCuadrante = () => {
    setIsLoading(true);
    
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const isNewCuadrante = !selectedCuadranteId;
    const computedName = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
    setCuadranteName(computedName);
    
    // Para nuevos cuadrantes, comenzar completamente vacío (sin empleados)
    const cuadranteEmployees: CuadranteEmployee[] = isNewCuadrante ? [] : baseEmployees.map((emp, index) => ({
      id: emp.id.toString(),
      name: emp.name.split(', ')[1] || emp.name.split(' ')[0] || emp.name,
      surname: emp.name.split(', ')[0] || emp.name.split(' ').slice(1).join(' ') || '',
      category: emp.category,
      contractHours: emp.contract,
      contractType: emp.contract === 8 ? 'INDEFINIDO' : 'TEMPORAL',
      contractUnits: emp.contractUnit,
      department: emp.department === 'PROPIO' ? 'PROPIO' : 'ETT',
      position: index,
      schedule: emp.schedule.slice(0, daysInMonth).reduce((acc, status, index) => {
        acc[index + 1] = status;
        return acc;
      }, {} as Record<number, string>)
    }));

    const newCuadrante: CuadranteMensualType = {
      id: selectedCuadranteId || `cuadrante-${selectedMonth}-${selectedYear}`,
      name: computedName,
      month: selectedMonth,
      year: selectedYear,
      daysInMonth,
      employees: cuadranteEmployees,
      occupancy: Array.from({ length: daysInMonth }, (_, i) => ({
        day: i + 1,
        occupancyPercentage: isNewCuadrante ? 0 : Math.floor(Math.random() * 40) + 50,
        isManual: false
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'DRAFT'
    };

    setCurrentCuadrante(newCuadrante);
    setIsLoading(false);
  };
  // Función para verificar si el cuadrante está vacío
  const isCuadranteEmpty = () => {
    if (!currentCuadrante) return true;
    
    const hasScheduleData = currentCuadrante.employees.some(emp => 
      Object.values(emp.schedule).some(status => status && status.trim() !== '')
    );
    
    const hasOccupancyData = currentCuadrante.occupancy.some(day => day.occupancyPercentage > 0);
    
    return !hasScheduleData && !hasOccupancyData;
  };

  // Autoguardado automático
  const handleAutoSave = (cuadrante: CuadranteMensualType) => {
    if (!cuadrante) return;
    
    const now = new Date();
    const cuadranteWithUpdatedAt = { ...cuadrante, updatedAt: now } as CuadranteMensualType;
    
    const mappedStatus = cuadranteWithUpdatedAt.status === 'PUBLISHED'
      ? 'published'
      : cuadranteWithUpdatedAt.status === 'ARCHIVED'
      ? 'archived'
      : 'draft';

    const cuadranteToSave = {
      id: cuadranteWithUpdatedAt.id,
      name: cuadranteWithUpdatedAt.name,
      month: MONTHS[cuadranteWithUpdatedAt.month - 1],
      year: cuadranteWithUpdatedAt.year,
      type: 'manual' as const,
      status: mappedStatus as 'draft' | 'published' | 'archived',
      createdAt: cuadranteWithUpdatedAt.createdAt,
      updatedAt: now,
      employeeCount: cuadranteWithUpdatedAt.employees.length,
      description: `Cuadrante de ${MONTHS[cuadranteWithUpdatedAt.month - 1]} ${cuadranteWithUpdatedAt.year}`
    };

    // Guardar resumen y datos completos
    upsertCuadrante(cuadranteToSave);
    upsertCuadranteData(cuadranteWithUpdatedAt);
    window.dispatchEvent(new Event('cuadrante-saved'));
  };
  // Hook de autoguardado
  const { forceSave, isAutoSaving } = useAutoSave({
    data: currentCuadrante,
    onSave: handleAutoSave,
    delay: 5000, // 5 segundos
    enabled: !!currentCuadrante && !readOnly
  });

  const handleSaveCuadrante = () => {
    if (!currentCuadrante) return;
    
    // Asegurar timestamp actualizado
    const updated: CuadranteMensualType = { ...currentCuadrante, updatedAt: new Date() };
    setCurrentCuadrante(updated);

    // Mapear status correctamente
    const mappedStatus = updated.status === 'PUBLISHED' ? 'published' :
                        updated.status === 'ARCHIVED' ? 'archived' : 'draft';

    // Persistir inmediatamente datos completos y resumen
    const summary = {
      id: updated.id,
      name: updated.name,
      month: MONTHS[updated.month - 1],
      year: updated.year,
      type: 'manual' as const,
      status: mappedStatus as 'draft' | 'published' | 'archived',
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      employeeCount: updated.employees.length,
      description: `Cuadrante de ${MONTHS[updated.month - 1]} ${updated.year}`
    };
    upsertCuadrante(summary);
    upsertCuadranteData(updated);

    console.log('Guardando cuadrante:', updated);
    
    toast({
      title: "Horario guardado",
      description: `${updated.name} ha sido guardado exitosamente`,
    });

    if (onBack) {
      setTimeout(() => {
        onBack();
      }, 800);
    }
  };

  const handleExportCuadrante = () => {
    if (!currentCuadrante) return;
    
    const dataStr = JSON.stringify(currentCuadrante, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${cuadranteName.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Cuadrante exportado",
      description: `Se ha descargado ${exportFileDefaultName}`,
    });
  };

  const handleImportFromPublicShift = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      initializeCuadrante();
      toast({
        title: "Datos importados",
        description: "Se han importado los datos desde el Turno Público",
      });
    }, 1000);
  };

  const addNewEmployee = () => {
    if (!currentCuadrante || !newEmployeeData.name.trim()) {
      toast({
        title: "Error",
        description: "Por favor, completa al menos el nombre del empleado",
        variant: "destructive"
      });
      return;
    }

    const contractUnits = newEmployeeData.contractHours === 8 ? 1.0 : 
                         newEmployeeData.contractHours === 6 ? 0.75 :
                         newEmployeeData.contractHours === 5 ? 0.625 : 0.5;

    const newEmployee: CuadranteEmployee = {
      id: `emp-${Date.now()}`,
      name: newEmployeeData.name.trim(),
      surname: newEmployeeData.surname.trim(),
      category: newEmployeeData.category.trim() || 'Sin categoría',
      contractHours: newEmployeeData.contractHours,
      contractType: newEmployeeData.contractHours === 8 ? 'INDEFINIDO' : 'TEMPORAL',
      contractUnits,
      department: newEmployeeData.department,
      position: currentCuadrante.employees.length,
      schedule: Array.from({ length: currentCuadrante.daysInMonth }, (_, i) => ({
        [i + 1]: ''
      })).reduce((acc, day) => ({ ...acc, ...day }), {})
    };

    const updatedCuadrante = {
      ...currentCuadrante,
      employees: [...currentCuadrante.employees, newEmployee],
      updatedAt: new Date()
    };

    setCurrentCuadrante(updatedCuadrante);
    
    // Reset form
    setNewEmployeeData({
      name: '',
      surname: '',
      category: '',
      contractHours: 8,
      department: 'PROPIO'
    });
    setShowAddEmployee(false);

    toast({
      title: "Empleado añadido",
      description: `${newEmployee.name} ${newEmployee.surname} ha sido añadido al cuadrante`,
    });
  };

  const importEmployeesFromDatabase = () => {
    if (!currentCuadrante) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      const cuadranteEmployees: CuadranteEmployee[] = baseEmployees.map((emp, index) => ({
        id: emp.id.toString(),
        name: emp.name.split(', ')[1] || emp.name.split(' ')[0] || emp.name,
        surname: emp.name.split(', ')[0] || emp.name.split(' ').slice(1).join(' ') || '',
        category: emp.category,
        contractHours: emp.contract,
        contractType: emp.contract === 8 ? 'INDEFINIDO' : 'TEMPORAL',
        contractUnits: emp.contractUnit,
        department: emp.department === 'PROPIO' ? 'PROPIO' : 'ETT',
        position: index,
        schedule: Array.from({ length: currentCuadrante.daysInMonth }, (_, i) => ({
          [i + 1]: ''
        })).reduce((acc, day) => ({ ...acc, ...day }), {})
      }));

      const updatedCuadrante = {
        ...currentCuadrante,
        employees: cuadranteEmployees,
        updatedAt: new Date()
      };

      setCurrentCuadrante(updatedCuadrante);
      setIsLoading(false);

      toast({
        title: "Empleados importados",
        description: `Se han importado ${cuadranteEmployees.length} empleados de la base de datos`,
      });
    }, 1000);
  };

  const handleImportCSV = (csvData: string, metadata: {
    fileName: string;
    cuadranteName: string;
    month: string;
    year: number;
    status: 'draft' | 'published' | 'archived';
  }) => {
    if (!currentCuadrante) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      // 1. Parse the month and year from metadata
      const monthIndex = MONTHS.findIndex(m => m.toLowerCase() === metadata.month.toLowerCase());
      const importMonth = monthIndex !== -1 ? monthIndex + 1 : 1;
      const importYear = metadata.year;
      const daysInMonth = new Date(importYear, importMonth, 0).getDate();
      
      // 2. Map status from dialog to internal format
      const internalStatus = metadata.status === 'published' ? 'PUBLISHED' :
                            metadata.status === 'archived' ? 'ARCHIVED' : 'DRAFT';

      // 3) CSV parser robusto (maneja comillas y comas internas)
      const rows = csvData
        .split(/\r?\n/)
        .filter(line => line.trim().length > 0)
        .map(line => {
          const cells: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (ch === ',' && !inQuotes) {
              cells.push(current.trim());
              current = '';
            } else {
              current += ch;
            }
          }
          cells.push(current.trim());
          return cells.map(c => c.replace(/^"|"$/g, '').trim());
        });

      // 4) Localizar cabeceras de días y fila de números (1..31)
      let headerRowIndex = -1;
      let dayStartCol = -1;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        for (let j = 0; j < row.length - 6; j++) {
          const seg = row.slice(j, j + 7).map(c => (c || '').toUpperCase());
          if ((seg[0] === 'S' && seg[1] === 'D') || (seg.includes('S') && seg.includes('D') && seg.includes('L'))) {
            headerRowIndex = i;
            dayStartCol = j;
            break;
          }
        }
        if (headerRowIndex !== -1) break;
      }
      if (headerRowIndex === -1) {
        setIsLoading(false);
        toast({ title: 'Error en CSV', description: 'No se encontró la fila de días (S,D,L,...)', variant: 'destructive' });
        return;
      }

      // Fila con números de días
      let numbersRowIndex = -1;
      for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 6, rows.length); i++) {
        const row = rows[i];
        const v = (row[dayStartCol] || '').replace(/^0/, '');
        if (v === '1') { numbersRowIndex = i; break; }
      }
      if (numbersRowIndex === -1) numbersRowIndex = headerRowIndex + 1;

      const numbersRow = rows[numbersRowIndex] || [];

      // 3) Construir un mapa robusto columna->día usando la fila de números
      const colIndexByDay: number[] = [];
      let colPtr = dayStartCol;
      for (let d = 1; d <= daysInMonth; d++) {
        while (colPtr < numbersRow.length) {
          const raw = (numbersRow[colPtr] || '').trim();
          const norm = raw.replace(/^0/, '');
          if (norm === String(d)) { colIndexByDay.push(colPtr); colPtr++; break; }
          colPtr++;
        }
        if (!colIndexByDay[d - 1]) {
          // Fallback: asumir posición secuencial
          colIndexByDay[d - 1] = (colIndexByDay[d - 2] ?? dayStartCol) + 1;
        }
      }

      // 4) Parsear empleados + secciones (8h,6h,5h,4h) y ETT
      const employees: CuadranteEmployee[] = [];
      let updatedOccupancy = [...currentCuadrante.occupancy]; // Variable temporal para ocupación
      let currentHours = 8;
      let currentUnits = 1.0;
      let currentDept: 'PROPIO' | 'ETT' = 'PROPIO';

      const isValidCode = (c: string) => ['X','XB','L','V','C','E','F','P','H','S'].includes((c||'').toUpperCase());

      for (let i = numbersRowIndex + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const rowText = row.slice(0, 8).join(' ').toLowerCase();

        // Actualizar contexto de sección
        if (rowText.includes('trabajadores eett')) { currentDept = 'ETT'; continue; }
        if (rowText.includes('eett banquetes')) { currentDept = 'ETT'; continue; }
        if (rowText.includes('8 horas')) { currentHours = 8; currentUnits = 1.0; continue; }
        if (rowText.includes('6 horas') || rowText.includes('0,75')) { currentHours = 6; currentUnits = 0.75; continue; }
        if (rowText.includes('5 horas') || rowText.includes('0,625') || rowText.includes('60%')) { currentHours = 5; currentUnits = 0.625; continue; }
        if (rowText.includes('4 horas') || rowText.includes('0,5')) { currentHours = 4; currentUnits = 0.5; continue; }

        // Ocupación diaria
        if (rowText.includes('ocupacion') || rowText.includes('ocupación')) {
          // Preferimos la fila que incluye el marcador NEWHOTEL porque contiene los 31 días + promedio
          const hasNewHotel = row.some(c => /newhotel/i.test((c || '').toString()))

          // Extraer todos los porcentajes numéricos de la fila
          const percents: number[] = [];
          for (let k = 0; k < row.length; k++) {
            const rawCell = (row[k] || '').toString().replace(/\u00A0/g, ' ').trim();
            if (!rawCell || /newhotel/i.test(rawCell)) continue; // saltar etiqueta
            const normalized = rawCell.replace(/\s*%/g, '').replace(',', '.').trim();
            const val = parseFloat(normalized);
            if (!isNaN(val)) percents.push(Math.round(val * 100) / 100);
          }

          // Reglas:
          // - Si hay NEWHOTEL y >= N valores, usar los primeros N (descartar promedio final)
          // - Si no hay NEWHOTEL pero hay exactamente N valores, usar esos N
          if ((hasNewHotel && percents.length >= daysInMonth) || (!hasNewHotel && percents.length === daysInMonth)) {
            for (let d = 1; d <= daysInMonth; d++) {
              const idx = updatedOccupancy.findIndex(o => o.day === d);
              if (idx >= 0) {
                updatedOccupancy[idx] = {
                  ...updatedOccupancy[idx],
                  occupancyPercentage: percents[d - 1],
                  isManual: true
                };
              }
            }
          }

          // Importante: no hacemos fallback a columnas de días para evitar tomar filas con solo promedios u otros totales
          continue;
        }

        // Filas no deseadas
        if (rowText.includes('total') || rowText.includes('cuadro de resumen') || rowText.includes('dias') || rowText.includes('empleado')) {
          continue;
        }

        // Nombre (col C index 2) y Categoría (col D index 3)
        const name = (row[2] || '').trim();
        // Si la categoría viene vacía en ETT, default a 'ETT'
        let category = (row[3] || '').trim();
        if (!category && currentDept === 'ETT') category = 'ETT';
        if (!name || name.length < 3 || (!category && currentDept !== 'ETT')) continue;
        const upperName = name.toUpperCase();
        if (upperName.includes('TRABAJADORES') || upperName.includes('ETT') || upperName.includes('TOTAL') || /^\d+$/.test(name)) continue;

        const schedule: Record<number, string> = {};
        for (let d = 1; d <= daysInMonth; d++) {
          const col = colIndexByDay[d - 1];
          const value = (row[col] || '').toString().trim().toUpperCase();
          schedule[d] = isValidCode(value) ? value : '';
        }
        let validCount = Object.values(schedule).filter(v => !!v).length;
        // Fallback para secciones que no siguen el mismo offset de columnas (p.ej., ETT con "NEWHOTEL")
        if (validCount === 0) {
          const seqCodes = row
            .map(c => (c || '').toString().trim().toUpperCase())
            .filter(c => isValidCode(c));
          if (seqCodes.length > 0) {
            for (let d = 1; d <= Math.min(daysInMonth, seqCodes.length); d++) {
              schedule[d] = seqCodes[d - 1];
            }
            validCount = seqCodes.length;
          }
        }
        if (validCount === 0) continue;

        const parts = name.split(' ').filter(Boolean);
        const firstName = parts[parts.length - 1];
        const surname = parts.slice(0, -1).join(' ');

        employees.push({
          id: `csv-${Date.now()}-${i}`,
          name: firstName,
          surname,
          category,
          contractHours: currentHours,
          contractType: currentHours === 8 ? 'INDEFINIDO' : 'TEMPORAL',
          contractUnits: currentUnits,
          department: currentDept,
          position: employees.length,
          schedule
        });
      }

      // 5) Aplicar resultados al cuadrante actual
      // 5. Update UI with imported metadata
      skipInitRef.current = true; // Prevent re-initialization
      setSelectedMonth(importMonth);
      setSelectedYear(importYear);
      setCuadranteName(metadata.cuadranteName);

      const updatedCuadrante: CuadranteMensualType = {
        ...currentCuadrante,
        id: currentCuadrante.id,
        name: metadata.cuadranteName,
        month: importMonth,
        year: importYear,
        daysInMonth,
        employees: currentCuadrante.employees.length ? [...currentCuadrante.employees, ...employees] : employees,
        occupancy: updatedOccupancy,
        status: internalStatus,
        updatedAt: new Date()
      };

      setCurrentCuadrante(updatedCuadrante);
      setIsLoading(false);

      toast({
        title: "CSV importado exitosamente",
        description: `Se han importado ${employees.length} empleados para ${metadata.month} ${metadata.year}`,
      });
    }, 1500);
  };

  const updateOccupancy = (day: number, percentage: number) => {
    if (!currentCuadrante) return;
    
    const updatedCuadrante = {
      ...currentCuadrante,
      occupancy: currentCuadrante.occupancy.map(occ => 
        occ.day === day 
          ? { ...occ, occupancyPercentage: percentage, isManual: true }
          : occ
      ),
      updatedAt: new Date()
    };
    
    setCurrentCuadrante(updatedCuadrante);
  };

  const handleClearScheduleConfirm = (type: 'mes' | 'semana1' | 'semana2' | 'semana3' | 'semana4') => {
    setPendingClearAction(type);
  };

  const executeClearSchedule = () => {
    if (!currentCuadrante || !pendingClearAction) return;

    const type = pendingClearAction;
    let startDay = 1;
    let endDay = currentCuadrante.daysInMonth;

    if (type === 'semana1') { startDay = 1; endDay = 7; }
    else if (type === 'semana2') { startDay = 8; endDay = 14; }
    else if (type === 'semana3') { startDay = 15; endDay = 21; }
    else if (type === 'semana4') { startDay = 22; endDay = currentCuadrante.daysInMonth; }

    const updatedCuadrante = {
      ...currentCuadrante,
      employees: currentCuadrante.employees.map(emp => {
        const newSchedule = { ...emp.schedule };
        for (let day = startDay; day <= Math.min(endDay, currentCuadrante.daysInMonth); day++) {
          newSchedule[day] = '';
        }
        return { ...emp, schedule: newSchedule };
      }),
      updatedAt: new Date()
    };

    setCurrentCuadrante(updatedCuadrante);
    setPendingClearAction(null);
    
    const periodName = type === 'mes' ? 'todo el mes' : 
                      type === 'semana1' ? 'la Semana 1 (días 1-7)' :
                      type === 'semana2' ? 'la Semana 2 (días 8-14)' :
                      type === 'semana3' ? 'la Semana 3 (días 15-21)' :
                      'la Semana 4+ (días 22-31)';
    
    toast({
      title: "Horarios borrados",
      description: `Se han borrado los horarios de ${periodName}`,
    });
  };

  const updateEmployeeSchedule = (employeeId: string, day: number, newCode: string) => {
    if (!currentCuadrante) return;
    
    const updatedCuadrante = {
      ...currentCuadrante,
      employees: currentCuadrante.employees.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            schedule: {
              ...emp.schedule,
              [day]: newCode
            }
          };
        }
        return emp;
      }),
      updatedAt: new Date() // Importante para activar el autoguardado
    };
    
    setCurrentCuadrante(updatedCuadrante);
    setEditingCell(null);
  };

  const updateEmployeeInfo = (employeeId: string, field: string, value: string | number) => {
    if (!currentCuadrante) return;
    
    const updatedCuadrante = {
      ...currentCuadrante,
      employees: currentCuadrante.employees.map(emp => {
        if (emp.id === employeeId) {
          return { ...emp, [field]: value };
        }
        return emp;
      }),
      updatedAt: new Date()
    };
    
    setCurrentCuadrante(updatedCuadrante);
  };

  const saveEmployeeChanges = (employeeId: string) => {
    setEditingEmployee(null);
    toast({
      title: "Información actualizada",
      description: "Los datos del empleado han sido actualizados",
    });
  };

  // Filtrar empleados por contrato
  const filteredEmployees = currentCuadrante?.employees.filter(emp => {
    if (contractFilter === 'todos') return true;
    return emp.contractHours === parseInt(contractFilter);
  }) || [];

  // Agrupar empleados por contrato
  const groupedEmployees = filteredEmployees.reduce((groups, emp) => {
    const key = `${emp.contractHours}h (${Math.round(emp.contractUnits * 100)}%)`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(emp);
    return groups;
  }, {} as Record<string, CuadranteEmployee[]>);

  // Obtener días a mostrar según el modo de vista
  const getDaysToShow = () => {
    if (!currentCuadrante) return [];
    
    if (viewMode === 'mes') {
      return Array.from({ length: currentCuadrante.daysInMonth }, (_, i) => i + 1);
    }
    
    const weekRanges = {
      semana1: [1, 7],
      semana2: [8, 14],
      semana3: [15, 21],
      semana4: [22, currentCuadrante.daysInMonth]
    };
    
    const [start, end] = weekRanges[viewMode];
    return Array.from({ length: Math.min(end - start + 1, currentCuadrante.daysInMonth - start + 1) }, (_, i) => start + i);
  };

  const daysToShow = getDaysToShow();

  const getCurrentStats = () => {
    if (!currentCuadrante) return null;
    
    const totalEmployees = currentCuadrante.employees.length;
    const avgOccupancy = currentCuadrante.occupancy.reduce((acc, day) => acc + day.occupancyPercentage, 0) / currentCuadrante.occupancy.length;
    const draftStatus = currentCuadrante.status === 'DRAFT';
    
    return {
      totalEmployees,
      avgOccupancy,
      draftStatus,
      lastUpdated: currentCuadrante.updatedAt
    };
  };

  const stats = getCurrentStats();
  const isEmpty = isCuadranteEmpty();

  return (
    <div className="space-y-6 max-w-full">
      {/* Header - Notion-inspired minimal */}
      <div className="pb-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Editor de Cuadrante</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Editor completo para gestionar cuadrantes mensuales con funcionalidades avanzadas
            </p>
          </div>
          {onBack && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Volver a Cuadrantes
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Volver a la lista de cuadrantes</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Modo solo lectura */}
      {readOnly && (
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
              <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">Modo Solo Lectura</h3>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Este cuadrante se está visualizando en modo solo lectura. No se pueden realizar modificaciones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estado vacío del cuadrante */}
      {isEmpty && !readOnly && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 p-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Cuadrante Vacío</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Este cuadrante está completamente vacío. Comienza añadiendo empleados y configurando la ocupación diaria.
              </p>
            </div>
            
            {/* Opciones de inicio rápido */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-lg mx-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setShowAddEmployee(true)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-0"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Añadir Empleado
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Crear un nuevo empleado manualmente</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={importEmployeesFromDatabase}
                    variant="outline"
                    className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
                  >
                    <Import className="h-4 w-4 mr-2" />
                    Importar Empleados
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Importar todos los empleados de la base de datos</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setIsImportDialogOpen(true)}
                    variant="outline"
                    className="w-full sm:w-auto border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Importar datos desde archivo CSV</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <MousePointer className="h-4 w-4" />
              <span>Después podrás hacer clic en las celdas para asignar códigos</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulario para añadir empleado */}
      {showAddEmployee && !readOnly && (
        <div className="bg-card rounded-lg border border-border/30 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Añadir Nuevo Empleado</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddEmployee(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cerrar formulario</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee-name">Nombre *</Label>
              <Input
                id="employee-name"
                value={newEmployeeData.name}
                onChange={(e) => setNewEmployeeData({...newEmployeeData, name: e.target.value})}
                placeholder="Juan"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="employee-surname">Apellidos</Label>
              <Input
                id="employee-surname"
                value={newEmployeeData.surname}
                onChange={(e) => setNewEmployeeData({...newEmployeeData, surname: e.target.value})}
                placeholder="García López"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="employee-category">Categoría</Label>
              <Input
                id="employee-category"
                value={newEmployeeData.category}
                onChange={(e) => setNewEmployeeData({...newEmployeeData, category: e.target.value})}
                placeholder="Camarero, Jefe de Bares, etc."
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="contract-hours">Contrato (horas)</Label>
              <Select
                value={newEmployeeData.contractHours.toString()}
                onValueChange={(value) => setNewEmployeeData({...newEmployeeData, contractHours: parseInt(value)})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 horas (100% - 1.0 U)</SelectItem>
                  <SelectItem value="6">6 horas (75% - 0.75 U)</SelectItem>
                  <SelectItem value="5">5 horas (62.5% - 0.625 U)</SelectItem>
                  <SelectItem value="4">4 horas (50% - 0.5 U)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="department">Departamento</Label>
              <Select
                value={newEmployeeData.department}
                onValueChange={(value: 'PROPIO' | 'ETT') => setNewEmployeeData({...newEmployeeData, department: value})}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROPIO">PROPIO</SelectItem>
                  <SelectItem value="ETT">ETT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAddEmployee(false)}
            >
              Cancelar
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={addNewEmployee}
                  disabled={!newEmployeeData.name.trim()}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Añadir Empleado
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Confirmar y añadir el nuevo empleado al cuadrante</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Configuration Header - Clean minimal design */}
      <div className="bg-card rounded-lg border border-border/30 shadow-sm">
        <div className="px-6 py-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-foreground">{cuadranteName}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  stats?.draftStatus 
                    ? 'bg-muted text-muted-foreground border-border' 
                    : 'bg-foreground/5 text-foreground border-foreground/10'
                }`}>
                  {stats?.draftStatus ? "DRAFT" : "PUBLICADO"}
                </div>
                <span className="text-sm text-muted-foreground">
                  {stats?.totalEmployees} empleados
                </span>
                {isEmpty && (
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                    <Plus className="h-3 w-3 mr-1" />
                    VACÍO
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOccupancy(!showOccupancy)}
                    className="h-8 px-3 text-muted-foreground hover:text-foreground"
                    disabled={readOnly}
                  >
                    {showOccupancy ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="ml-2 text-xs">Ocupación</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showOccupancy ? 'Ocultar' : 'Mostrar'} porcentajes de ocupación diaria</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStats(!showStats)}
                    className="h-8 px-3 text-muted-foreground hover:text-foreground"
                  >
                    {showStats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="ml-2 text-xs">Estadísticas</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showStats ? 'Ocultar' : 'Mostrar'} estadísticas calculadas del cuadrante</p>
                </TooltipContent>
              </Tooltip>
              
              <div className="w-px h-4 bg-border mx-1" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleImportFromPublicShift} className="h-8 px-3 text-muted-foreground hover:text-foreground">
                    <Upload className="h-4 w-4" />
                    <span className="ml-2 text-xs">Importar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Importar datos desde el Turno Público</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleExportCuadrante} className="h-8 px-3 text-muted-foreground hover:text-foreground">
                    <Download className="h-4 w-4" />
                    <span className="ml-2 text-xs">Exportar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Descargar cuadrante como archivo JSON</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-muted-foreground hover:text-foreground">
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configuración del cuadrante</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Vista y filtros - Clean minimal tabs */}
          <div className="flex items-center justify-between">
            <div className="flex bg-background rounded-md border border-border/50 p-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('mes')}
                className={`h-7 px-3 text-xs rounded-sm ${
                  viewMode === 'mes' 
                    ? 'bg-foreground text-background shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mes Completo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('semana1')}
                className={`h-7 px-3 text-xs rounded-sm ${
                  viewMode === 'semana1' 
                    ? 'bg-foreground text-background shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Semana 1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('semana2')}
                className={`h-7 px-3 text-xs rounded-sm ${
                  viewMode === 'semana2' 
                    ? 'bg-foreground text-background shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Semana 2
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('semana3')}
                className={`h-7 px-3 text-xs rounded-sm ${
                  viewMode === 'semana3' 
                    ? 'bg-foreground text-background shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Semana 3
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('semana4')}
                className={`h-7 px-3 text-xs rounded-sm ${
                  viewMode === 'semana4' 
                    ? 'bg-foreground text-background shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Semana 4+
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {/* Botones de gestión de empleados */}
              {currentCuadrante && currentCuadrante.employees.length === 0 && !readOnly && (
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => setShowAddEmployee(true)}
                        className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white border-0"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Añadir
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Añadir un empleado manualmente</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={importEmployeesFromDatabase}
                        className="h-7 px-3 text-xs border-border/50"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Importar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Importar empleados de la base de datos</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              
              {currentCuadrante && currentCuadrante.employees.length > 0 && !readOnly && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={() => setShowAddEmployee(true)}
                      variant="outline"
                      className="h-7 px-3 text-xs border-border/50"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Añadir
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Añadir nuevo empleado al cuadrante</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <div className="flex items-center gap-2">
                <Label htmlFor="contract-filter" className="text-xs text-muted-foreground">Contrato:</Label>
                <Select value={contractFilter} onValueChange={setContractFilter}>
                  <SelectTrigger className="h-7 w-24 text-xs border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    <SelectItem value="todos" className="text-xs">Todos</SelectItem>
                    <SelectItem value="8" className="text-xs">8h</SelectItem>
                    <SelectItem value="6" className="text-xs">6h</SelectItem>
                    <SelectItem value="5" className="text-xs">5h</SelectItem>
                    <SelectItem value="4" className="text-xs">4h</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Trash icon with dropdown */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Select onValueChange={(value) => handleClearScheduleConfirm(value as any)}>
                    <SelectTrigger className="h-7 w-7 p-0 border-border/50 hover:bg-muted/50 data-[state=open]:bg-muted">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-lg z-50 w-48">
                      <SelectItem value="mes" className="text-xs text-destructive font-medium">
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-3.5 w-3.5" />
                          Mes Completo
                        </div>
                      </SelectItem>
                      <SelectItem value="semana1" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-3.5 w-3.5" />
                          Semana 1 (1-7)
                        </div>
                      </SelectItem>
                      <SelectItem value="semana2" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-3.5 w-3.5" />
                          Semana 2 (8-14)
                        </div>
                      </SelectItem>
                      <SelectItem value="semana3" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-3.5 w-3.5" />
                          Semana 3 (15-21)
                        </div>
                      </SelectItem>
                      <SelectItem value="semana4" className="text-xs">
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-3.5 w-3.5" />
                          Semana 4+ (22-31)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Borrar horarios de empleados por periodo</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Mes y año selector - Minimal inline */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="month-select" className="text-xs text-muted-foreground">Mes:</Label>
                <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                  <SelectTrigger id="month-select" className="h-7 w-24 text-xs border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()} className="text-xs">
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="year-select" className="text-xs text-muted-foreground">Año:</Label>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger id="year-select" className="h-7 w-20 text-xs border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={year.toString()} className="text-xs">
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleSaveCuadrante} 
                  disabled={isLoading || isAutoSaving}
                  size="sm"
                  className="h-7 px-3 text-xs bg-foreground text-background hover:bg-foreground/90"
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {isAutoSaving ? "Autoguardando..." : "Guardar"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isAutoSaving ? "Guardado automático en progreso..." : "Guardar cambios del cuadrante"}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Indicador de autoguardado */}
            {isAutoSaving && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <span>Autoguardando...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leyenda de códigos - Notion style */}
      <div className="bg-card rounded-lg border border-border/30 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {statusCodes.map(status => (
              <div key={status.code} className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${status.color}`}>
                {status.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cuadrante Principal */}
      {currentCuadrante && (
        <div className="bg-card rounded-lg border border-border/30 shadow-sm">
          <div className="p-6 overflow-x-auto">
            <div className="min-w-[1000px]">
              
              {/* Estadísticas del Cuadrante - BLOQUEADAS PARA EDICIÓN */}
              {showStats && (
                <div className="mb-6 bg-foreground/3 border border-border/50 rounded-lg">
                  <div className="px-4 py-3 border-b border-border/30">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium text-sm text-foreground">Estadísticas del Cuadrante</h3>
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                        SOLO LECTURA
                      </div>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {/* Unificamos la visualización de estadísticas usando el componente único */}
                    <CuadranteStats cuadrante={currentCuadrante} />
                  </div>
                </div>
              )}

              {/* Cuadrante de empleados */}
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header con días */}
                  <div className="grid gap-1 mb-4" style={{gridTemplateColumns: `250px 120px 80px repeat(${daysToShow.length}, minmax(50px, 1fr))`}}>
                    <div className="font-medium text-xs p-3 bg-foreground/5 text-foreground border border-border/20 rounded">Empleado</div>
                    <div className="font-medium text-xs p-3 bg-foreground/5 text-foreground border border-border/20 rounded text-center">Categoría</div>
                    <div className="font-medium text-xs p-3 bg-foreground/5 text-foreground border border-border/20 rounded text-center">Contrato</div>
                    {daysToShow.map(day => {
                      const date = new Date(selectedYear, selectedMonth - 1, day);
                      const weekDay = ['D', 'L', 'M', 'MI', 'J', 'V', 'S'][date.getDay()];
                      return (
                        <div key={day} className="text-center p-2 bg-foreground/5 text-foreground border border-border/20 rounded">
                          <div className="font-medium text-xs">{weekDay}</div>
                          <div className="text-xs">{day}</div>
                          {showOccupancy && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              {currentCuadrante.occupancy.find(o => o.day === day)?.occupancyPercentage || 0}%
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Empleados agrupados por contrato */}
                  {Object.entries(groupedEmployees).map(([contractGroup, employees]) => (
                    <div key={contractGroup} className="mb-6">
                      <div className="mb-2 p-2 bg-foreground/8 text-foreground border border-border/30 rounded-md">
                        <h4 className="font-medium text-sm">{contractGroup}</h4>
                      </div>
                      
                      {employees.map((employee) => (
                        <div key={employee.id} className="grid gap-1 mb-1" style={{gridTemplateColumns: `250px 120px 80px repeat(${daysToShow.length}, minmax(50px, 1fr))`}}>
                          {/* Información del empleado editable */}
                          <div className="p-2 bg-background border border-border/30 rounded text-xs">
                            {editingEmployee === employee.id ? (
                              <div className="space-y-1">
                                <Input
                                  value={employee.surname}
                                  onChange={(e) => updateEmployeeInfo(employee.id, 'surname', e.target.value)}
                                  className="h-6 text-xs"
                                  placeholder="Apellidos"
                                />
                                <Input
                                  value={employee.name}
                                  onChange={(e) => updateEmployeeInfo(employee.id, 'name', e.target.value)}
                                  className="h-6 text-xs"
                                  placeholder="Nombre"
                                />
                                 <div className="flex gap-1">
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <Button
                                         size="sm"
                                         onClick={() => saveEmployeeChanges(employee.id)}
                                         className="h-5 px-2 text-[10px] bg-foreground text-background"
                                       >
                                         <Save className="h-3 w-3" />
                                       </Button>
                                     </TooltipTrigger>
                                     <TooltipContent>
                                       <p>Guardar cambios del empleado</p>
                                     </TooltipContent>
                                   </Tooltip>
                                   
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <Button
                                         size="sm"
                                         variant="ghost"
                                         onClick={() => setEditingEmployee(null)}
                                         className="h-5 px-2 text-[10px]"
                                       >
                                         <X className="h-3 w-3" />
                                       </Button>
                                     </TooltipTrigger>
                                     <TooltipContent>
                                       <p>Cancelar edición</p>
                                     </TooltipContent>
                                   </Tooltip>
                                 </div>
                              </div>
                            ) : (
                              <div 
                                className="cursor-pointer hover:bg-foreground/5 p-1 rounded"
                                onClick={() => setEditingEmployee(employee.id)}
                              >
                                <div className="font-medium text-foreground flex items-center gap-1">
                                  {employee.surname}
                                  <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                </div>
                                <div className="text-muted-foreground">{employee.name}</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Categoría editable */}
                          <div className="p-2 bg-background border border-border/30 rounded text-xs text-center">
                            {editingEmployee === employee.id ? (
                              <Select
                                value={employee.category}
                                onValueChange={(value) => updateEmployeeInfo(employee.id, 'category', value)}
                              >
                                <SelectTrigger className="h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border shadow-lg z-50">
                                  <SelectItem value="JEFE BARES" className="text-xs">JEFE BARES</SelectItem>
                                  <SelectItem value="2º JEFE BARES" className="text-xs">2º JEFE BARES</SelectItem>
                                  <SelectItem value="JEFE SECTOR" className="text-xs">JEFE SECTOR</SelectItem>
                                  <SelectItem value="CAMARERO" className="text-xs">CAMARERO</SelectItem>
                                  <SelectItem value="AYUDANTE" className="text-xs">AYUDANTE</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="text-muted-foreground">{employee.category}</div>
                            )}
                          </div>
                          
                          {/* Contrato editable */}
                          <div className="p-2 bg-background border border-border/30 rounded text-xs text-center">
                            {editingEmployee === employee.id && !readOnly ? (
                              <Select
                                value={employee.contractHours.toString()}
                                onValueChange={(value) => {
                                  const hours = parseInt(value);
                                  updateEmployeeInfo(employee.id, 'contractHours', hours);
                                  // Actualizar contractUnits basado en las horas
                                  const units = hours === 8 ? 1 : hours === 6 ? 0.75 : hours === 5 ? 0.625 : hours === 4 ? 0.5 : 1;
                                  updateEmployeeInfo(employee.id, 'contractUnits', units);
                                }}
                              >
                                <SelectTrigger className="h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border shadow-lg z-50">
                                  <SelectItem value="8" className="text-xs">8h</SelectItem>
                                  <SelectItem value="6" className="text-xs">6h</SelectItem>
                                  <SelectItem value="5" className="text-xs">5h</SelectItem>
                                  <SelectItem value="4" className="text-xs">4h</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="text-muted-foreground">{employee.contractHours}h</div>
                            )}
                          </div>
                          
                          {/* Días del schedule - MEJORADO PARA CELDAS VACÍAS */}
                          {daysToShow.map(day => {
                            const status = employee.schedule[day] || '';
                            const isEditing = editingCell?.employeeId === employee.id && editingCell?.day === day;
                            const isEmpty = !status || status.trim() === '';
                            
                            return (
                              <div key={day} className="relative">
                                {isEditing ? (
                                  <div data-editing-cell className="absolute inset-0 z-10">
                                    <Select
                                      value={status}
                                      onValueChange={(value) => updateEmployeeSchedule(employee.id, day, value)}
                                    >
                                      <SelectTrigger className="h-full w-full text-xs border-2 border-foreground/20">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent data-select-content className="bg-background border border-border shadow-lg z-50">
                                        {statusCodes.map(statusCode => (
                                          <SelectItem key={statusCode.code} value={statusCode.code} className="text-xs">
                                            {statusCode.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <div
                                    className={`h-10 w-full border border-border/30 rounded text-xs font-medium flex items-center justify-center transition-all duration-200 ${
                                      readOnly 
                                        ? 'cursor-not-allowed opacity-75' 
                                        : 'cursor-pointer'
                                    } ${
                                      isEmpty 
                                        ? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-dashed border-slate-300 dark:border-slate-600 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 hover:border-blue-300 dark:hover:border-blue-700 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
                                        : `hover:bg-foreground/5 ${getStatusColor(status)}`
                                    }`}
                                    onClick={() => !readOnly && setEditingCell({ employeeId: employee.id, day })}
                                  >
                                    {isEmpty ? (
                                      <div className="flex items-center justify-center">
                                        <Plus className="h-3 w-3 opacity-60" />
                                      </div>
                                    ) : (
                                      status
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ImportCSVDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImportCSV}
      />

      {/* Diálogo de confirmación para borrar horarios */}
      <AlertDialog open={!!pendingClearAction} onOpenChange={() => setPendingClearAction(null)}>
        <AlertDialogContent className="bg-background border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Confirmar borrado de horarios
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {pendingClearAction === 'mes' && 
                '¿Estás seguro de que quieres borrar todos los horarios del mes completo? Esta acción no se puede deshacer.'
              }
              {pendingClearAction === 'semana1' && 
                '¿Estás seguro de que quieres borrar los horarios de la Semana 1 (días 1-7)? Esta acción no se puede deshacer.'
              }
              {pendingClearAction === 'semana2' && 
                '¿Estás seguro de que quieres borrar los horarios de la Semana 2 (días 8-14)? Esta acción no se puede deshacer.'
              }
              {pendingClearAction === 'semana3' && 
                '¿Estás seguro de que quieres borrar los horarios de la Semana 3 (días 15-21)? Esta acción no se puede deshacer.'
              }
              {pendingClearAction === 'semana4' && 
                '¿Estás seguro de que quieres borrar los horarios de la Semana 4+ (días 22-31)? Esta acción no se puede deshacer.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setPendingClearAction(null)}
              className="bg-background text-foreground border border-border hover:bg-muted"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeClearSchedule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Borrar horarios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
