import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') || 'https://turnosmart.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DatabaseError extends Error {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Utilidades de parsing desde Google Sheets (CSV)
/**
 * Construye la URL de exportación CSV de Google Sheets para una pestaña concreta.
 */
function buildCsvUrl(sheetId: string, gid: string | number) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Parser CSV mejorado para manejar comillas y comas dentro de campos
 */
function parseCsv(text: string): string[][] {
  return text
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
            // Comillas escapadas ""
            current += '"';
            i++; // Saltar la siguiente comilla
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
}

/**
 * Normaliza el nombre para poder cruzarlo con la tabla de empleados.
 */
function normalizeName(name: string): string {
  return (name || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Devuelve true si el código de celda es un estado válido del Cantaclaro.
 */
function isValidStatusCode(code: string): boolean {
  const c = (code || '').toUpperCase();
  return c === 'X' || c === 'XB' || c === 'L' || c === 'V' || c === 'C' || c === 'E' || c === 'F' || c === 'P' || c === 'H' || c === 'S';
}

/**
 * Extrae datos exactos del CSV de "Enero Cantaclaro"
 * Analiza dinámicamente la estructura del Excel
 */
function extractFromEneroCsv(rows: string[][]) {
  const schedulesByName = new Map<string, string[]>();
  const occupancy: number[] = [];
  const clients: number[] = [];

  console.log('🔍 Procesando', rows.length, 'filas del CSV');

  // Debug: mostrar estructura inicial
  console.log('📋 Primeras 5 filas para análisis:');
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    console.log(`Fila ${i}:`, rows[i]?.slice(0, 10).join(' | '));
  }

  // Buscar fila de encabezados con días de la semana
  let headerRowIndex = -1;
  let dayStartCol = -1;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    // Buscar columna que empiece con 'S' seguida de otros días
    for (let j = 2; j < row.length - 7; j++) {
      const cells = row.slice(j, j + 7).map(c => (c || '').trim().toUpperCase());
      // Patrón típico: S, D, L, M, MI, J, V (puede variar)
      if ((cells[0] === 'S' && cells[1] === 'D') || 
          (cells.includes('S') && cells.includes('D') && cells.includes('L'))) {
        headerRowIndex = i;
        dayStartCol = j;
        break;
      }
    }
    if (headerRowIndex !== -1) break;
  }

  if (headerRowIndex === -1) {
    console.warn('❌ No se encontró la fila de encabezados de días');
    return { schedulesByName, occupancy: null, clients: null };
  }

  console.log(`✅ Encabezados en fila ${headerRowIndex}, columna ${dayStartCol}`);
  console.log('📅 Días encontrados:', rows[headerRowIndex]?.slice(dayStartCol, dayStartCol + 7));

  // Buscar fila de números (1, 2, 3, ... 31)
  let numbersRowIndex = -1;
  for (let i = headerRowIndex + 1; i < Math.min(headerRowIndex + 4, rows.length); i++) {
    const row = rows[i];
    const firstCell = (row[dayStartCol] || '').trim();
    if (firstCell === '1' || firstCell === '01') {
      numbersRowIndex = i;
      console.log(`🔢 Números en fila ${i}:`, row.slice(dayStartCol, dayStartCol + 10));
      break;
    }
  }

  if (numbersRowIndex === -1) {
    numbersRowIndex = headerRowIndex + 1; // Fallback
  }

  // Procesar todas las filas después de los números
  for (let i = numbersRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Detectar fila de ocupación
    const rowText = row.slice(0, 5).join(' ').toLowerCase();
    if (rowText.includes('ocup')) {
      console.log(`📊 Ocupación en fila ${i}:`, row.slice(dayStartCol, dayStartCol + 5));
      for (let day = 0; day < 31; day++) {
        const cellValue = (row[dayStartCol + day] || '')
          .replace('%', '')
          .replace(',', '.')
          .trim();
        const num = parseFloat(cellValue);
        if (!isNaN(num) && num >= 0) {
          occupancy[day] = num;
        }
      }
      continue;
    }

    // Detectar fila de clientes
    if (rowText.includes('client')) {
      console.log(`👥 Clientes en fila ${i}:`, row.slice(dayStartCol, dayStartCol + 5));
      for (let day = 0; day < 31; day++) {
        const cellValue = (row[dayStartCol + day] || '').replace(/[^\d]/g, '');
        const num = parseInt(cellValue, 10);
        if (!isNaN(num) && num > 0) {
          clients[day] = num;
        }
      }
      continue;
    }

    // Buscar empleados - típicamente nombre en columna C (índice 2) y categoría en D (índice 3)
    const name = (row[2] || '').trim();
    const category = (row[3] || '').trim();
    
    if (!name || !category || name.length < 3) continue;
    
    // Filtrar filas no deseadas
    const upperName = name.toUpperCase();
    if (upperName.includes('TOTAL') || 
        upperName.includes('TRABAJADORES') || 
        upperName.includes('ETT') ||
        upperName.includes('PERSONAL') ||
        upperName.includes('PROPIO') ||
        /^\d+$/.test(name)) {
      continue;
    }

    // Extraer códigos de los 31 días
    const dayCodes: string[] = [];
    for (let day = 0; day < 31; day++) {
      const cellValue = (row[dayStartCol + day] || '').trim().toUpperCase();
      dayCodes.push(cellValue);
    }

    // Solo procesar si tiene códigos válidos
    const validCodes = dayCodes.filter(code => isValidStatusCode(code));
    if (validCodes.length > 0) {
      schedulesByName.set(normalizeName(name), dayCodes);
      console.log(`👤 ${name} (${category}): ${dayCodes.slice(0, 7).join(',')}`);
    }
  }

  // Resultados finales
  console.log(`✅ Procesamiento completo:`);
  console.log(`   - Empleados: ${schedulesByName.size}`);
  console.log(`   - Ocupación: ${occupancy.filter(o => o > 0).length} días`);
  console.log(`   - Clientes: ${clients.filter(c => c > 0).length} días`);
  
  if (occupancy.length > 0) {
    console.log(`   - Ocupación muestra: [${occupancy.slice(0, 5).join(', ')}]`);
  }
  if (clients.length > 0) {
    console.log(`   - Clientes muestra: [${clients.slice(0, 5).join(', ')}]`);
  }

  return {
    schedulesByName,
    occupancy: occupancy.length > 0 ? occupancy : null,
    clients: clients.length > 0 ? clients : null,
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    console.log('🚀 Iniciando creación del cuadrante de Enero 2011...');

    // 1. Verificar cuadrante existente
    const { data: existingCuadrante } = await supabaseClient
      .from('cuadrantes')
      .select('id')
      .eq('name', 'Enero Cantaclaro')
      .eq('month', 1)
      .eq('year', 2011)
      .maybeSingle();

    let cuadranteId: string;

    if (existingCuadrante) {
      cuadranteId = existingCuadrante.id;
      console.log('📋 Cuadrante existente:', cuadranteId);
    } else {
      const { data: newCuadrante, error: cuadranteError } = await supabaseClient
        .from('cuadrantes')
        .insert({
          name: 'Enero Cantaclaro',
          month: 1,
          year: 2011,
          hotel_rooms: 581
        })
        .select('id')
        .single();

      if (cuadranteError) throw cuadranteError;
      cuadranteId = newCuadrante.id;
      console.log('📋 Nuevo cuadrante creado:', cuadranteId);
    }

    // 2. Obtener empleados
    const { data: employees, error: employeesError } = await supabaseClient
      .from('employees')
      .select('*')
      .order('employee_type', { ascending: true })
      .order('employee_number', { ascending: true });

    if (employeesError) throw employeesError;
    console.log('👥 Empleados obtenidos:', employees.length);

    // 3. Leer el archivo CSV exacto que proporcionó el usuario
    console.log('📁 Leyendo archivo CSV exacto del usuario...');
    
    let csvText: string;
    try {
      csvText = await Deno.readTextFile('./enero-cantaclaro-exact.csv');
      console.log('✅ Archivo CSV exacto leído exitosamente');
    } catch (error) {
      console.error('❌ Error leyendo archivo CSV exacto:', error);
      throw new Error('No se pudo leer el archivo CSV exacto');
    }
    
    const rows = parseCsv(csvText);
    console.log('📄 Filas CSV obtenidas:', rows.length);

    // 4. Extraer datos del Excel
    const { schedulesByName, occupancy, clients } = extractFromEneroCsv(rows);

    if (schedulesByName.size === 0) {
      console.warn('⚠️ No se detectaron empleados válidos en el CSV');
    }

    // 5. Crear asignaciones exactas
    const assignments: any[] = [];

    for (const employee of employees) {
      const normName = normalizeName(employee.name);
      const codes = schedulesByName.get(normName);

      for (let day = 1; day <= 31; day++) {
        const excelCode = codes ? (codes[day - 1] || '') : '';
        const statusCode = isValidStatusCode(excelCode) ? excelCode : '';

        assignments.push({
          cuadrante_id: cuadranteId,
          employee_id: employee.id,
          day_of_month: day,
          status_code: statusCode,
          start_time: null,
          location: null
        });
      }
    }

    // 6. Limpiar y crear asignaciones
    await supabaseClient
      .from('cuadrante_assignments')
      .delete()
      .eq('cuadrante_id', cuadranteId);

    if (assignments.length) {
      const { error: assignmentsError } = await supabaseClient
        .from('cuadrante_assignments')
        .insert(assignments);

      if (assignmentsError) throw assignmentsError;
    }

    // 7. Crear datos de ocupación
    const occupancyData: any[] = [];

    for (let day = 1; day <= 31; day++) {
      const occPercentage = occupancy && occupancy[day - 1] ? occupancy[day - 1] : 0;
      const totalClients = clients && clients[day - 1] ? clients[day - 1] : 0;

      occupancyData.push({
        cuadrante_id: cuadranteId,
        day_of_month: day,
        occupancy_percentage: Math.round(occPercentage * 100) / 100,
        total_clients: totalClients
      });
    }

    // Limpiar y crear ocupación
    await supabaseClient
      .from('daily_occupancy')
      .delete()
      .eq('cuadrante_id', cuadranteId);

    if (occupancyData.length) {
      const { error: occupancyError } = await supabaseClient
        .from('daily_occupancy')
        .insert(occupancyData);

      if (occupancyError) throw occupancyError;
    }

    console.log('✅ Cuadrante creado con datos EXACTOS del Excel');

    return new Response(JSON.stringify({
      success: true,
      cuadranteId,
      message: 'Cuadrante de Enero Cantaclaro 2011 creado con datos EXACTOS del Excel',
      employeesProcessed: employees.length,
      assignmentsCreated: assignments.length,
      occupancyDaysCreated: occupancyData.length,
      excelEmployeesDetected: schedulesByName.size,
      hasExactOccupancy: Boolean(occupancy),
      hasExactClients: Boolean(clients)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error creando cuadrante:', error);
    const dbError = error as DatabaseError;
    
    return new Response(JSON.stringify({
      success: false,
      error: dbError.message,
      details: dbError.details,
      hint: dbError.hint
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});