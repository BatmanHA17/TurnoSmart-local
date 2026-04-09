#!/usr/bin/env node
/**
 * importHistoricalShifts.mjs
 *
 * Parses historical shift data from the Excel file
 * "DATA_TURNOS REALES AGO25 A ABRIL26.xlsx" and generates
 * SQL INSERT statements for calendar_shifts and daily_occupancy tables.
 *
 * Usage: node scripts/importHistoricalShifts.mjs
 * Output: scripts/historical_shifts_insert.sql
 */

import XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Configuration ───────────────────────────────────────────────────────────

const EXCEL_PATH = '/Users/josegalvan/Downloads/DATA_TURNOS REALES AGO25 A ABRIL26.xlsx';
const OUTPUT_PATH = join(__dirname, 'historical_shifts_insert.sql');
const SHEET_NAME = 'Hoja1';

// Hotel Victoria org_id (from CLAUDE.md — cloud org)
const ORG_ID = '99c21a44-a760-4fc2-a0ad-152cf5d3d77f';

// Month name to year-month mapping
const MONTH_MAP = {
  'AGOSTO':     { year: 2025, month: 8 },
  'SEPTIEMBRE': { year: 2025, month: 9 },
  'OCTUBRE':    { year: 2025, month: 10 },
  'NOVIEMBRE':  { year: 2025, month: 11 },
  'DICIEMBRE':  { year: 2025, month: 12 },
  'ENERO':      { year: 2026, month: 1 },
  'FEBRERO':    { year: 2026, month: 2 },
  'MARZO':      { year: 2026, month: 3 },
  'ABRIL':      { year: 2026, month: 4 },
};

// Employee name mapping: Excel name -> display name for DB lookup
const EMPLOYEE_MAP = {
  'MANUEL':    'Manuel',
  'TRIANA':    'Triana',
  'BELEN':     'Belén',
  'ELENA':     'Elena',
  'ALI':       'Alicia',
  'CLARA':     'Clara',
  'EVA':       'Eva',
  'MARGARITA': 'Margarita',
  'MARGAR':    'Margarita',
  'NUEV@':     'Nuevo 3',
  'NUEVO':     'Nuevo 3',
  'NUEVO 3':   'Nuevo 3',
  'ELENA D':   'Elena D.',
  'ELENA D.':  'Elena D.',
  'VERA':      'Vera',
};

// Shift code normalization
const SHIFT_CODES = {
  'M':      { code: 'M', start: '07:00', end: '15:00' },
  'm':      { code: 'M', start: '07:00', end: '15:00' },
  'T':      { code: 'T', start: '15:00', end: '23:00' },
  't':      { code: 'T', start: '15:00', end: '23:00' },
  'N':      { code: 'N', start: '23:00', end: '07:00' },
  'D':      { code: 'D', absence: true },
  'DD':     { code: 'D', absence: true },
  'V':      { code: 'V', absence: true },
  'F':      { code: 'F', absence: true },
  'P':      { code: 'P', absence: true },
  'L':      { code: 'L', absence: true },
  'DB':     { code: 'DB', absence: true },
  'DG':     { code: 'DG', absence: true },
  'G':      { code: 'G', start: '09:00', end: '21:00' },
  'GG':     { code: 'G', start: '09:00', end: '21:00' },
  'PM':     { code: 'PM', absence: true },
  'PH':     { code: 'PH', absence: true },
  'A':      { code: 'A', absence: true },
  'GT':     { code: 'GT', start: '15:00', end: '23:00' },
  // Custom hour ranges
  '9*17':   { code: '9x17', start: '09:00', end: '17:00' },
  '09*17':  { code: '9x17', start: '09:00', end: '17:00' },
  '9x17':   { code: '9x17', start: '09:00', end: '17:00' },
  '10*18':  { code: '10x18', start: '10:00', end: '18:00' },
  '10x18':  { code: '10x18', start: '10:00', end: '18:00' },
  '11*19':  { code: '11x19', start: '11:00', end: '19:00' },
  '11x19':  { code: '11x19', start: '11:00', end: '19:00' },
  '12*20':  { code: '12x20', start: '12:00', end: '20:00' },
  '12x20':  { code: '12x20', start: '12:00', end: '20:00' },
  '13*21':  { code: '13x21', start: '13:00', end: '21:00' },
  '13x21':  { code: '13x21', start: '13:00', end: '21:00' },
  '14*22':  { code: '14x22', start: '14:00', end: '22:00' },
  '14x22':  { code: '14x22', start: '14:00', end: '22:00' },
  '8*16':   { code: '8x16', start: '08:00', end: '16:00' },
  '08*16':  { code: '8x16', start: '08:00', end: '16:00' },
  '8x16':   { code: '8x16', start: '08:00', end: '16:00' },
  // Compound codes
  'M/H':    { code: 'M', start: '07:00', end: '15:00' },
  'D/A':    { code: 'D', absence: true },
};

// Color mapping
const COLOR_MAP = {
  'M':    '#fef3c7',
  'T':    '#fed7aa',
  'N':    '#c7d2fe',
  'D':    '#d1d5db',
  'V':    '#bbf7d0',
  'F':    '#e5e7eb',
  'P':    '#e5e7eb',
  'L':    '#e5e7eb',
  'DB':   '#e5e7eb',
  'DG':   '#e5e7eb',
  'G':    '#fca5a5',
  'GT':   '#fca5a5',
  'PM':   '#e5e7eb',
  'PH':   '#e5e7eb',
  'A':    '#e5e7eb',
  '9x17': '#fde68a',
  '10x18':'#fde68a',
  '11x19':'#fde68a',
  '12x20':'#fde68a',
  '13x21':'#fde68a',
  '14x22':'#fde68a',
  '8x16': '#fde68a',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCellValue(ws, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell = ws[addr];
  if (!cell) return null;
  return cell.v;
}

function getCellString(ws, r, c) {
  const v = getCellValue(ws, r, c);
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function normalizeShiftCode(raw) {
  if (!raw || raw === '') return null;
  const trimmed = String(raw).trim();
  if (trimmed === '' || trimmed === 'X') return null; // X = skip (training)

  // Direct lookup
  if (SHIFT_CODES[trimmed]) return SHIFT_CODES[trimmed];

  // Try uppercase
  const upper = trimmed.toUpperCase();
  if (SHIFT_CODES[upper]) return SHIFT_CODES[upper];

  // Try matching custom hour patterns like "10*18", "09*17" etc.
  const hourMatch = trimmed.match(/^(\d{1,2})\s*[\*xX×]\s*(\d{1,2})$/);
  if (hourMatch) {
    const startH = parseInt(hourMatch[1]);
    const endH = parseInt(hourMatch[2]);
    const code = `${startH}x${endH}`;
    return {
      code,
      start: `${String(startH).padStart(2, '0')}:00`,
      end: `${String(endH).padStart(2, '0')}:00`,
    };
  }

  // Handle compound codes with slash (take first part)
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    return normalizeShiftCode(parts[0]);
  }

  console.warn(`  [WARN] Unknown shift code: "${trimmed}"`);
  return { code: trimmed, absence: true }; // Treat unknown as absence
}

function getColor(code) {
  return COLOR_MAP[code] || '#e5e7eb';
}

function sqlEscape(s) {
  if (s === null || s === undefined) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function normalizeEmployeeName(raw) {
  const trimmed = String(raw).trim().replace(/\s+/g, ' ');
  // Try exact match first
  if (EMPLOYEE_MAP[trimmed]) return EMPLOYEE_MAP[trimmed];
  // Try uppercase
  const upper = trimmed.toUpperCase();
  if (EMPLOYEE_MAP[upper]) return EMPLOYEE_MAP[upper];
  // Try without trailing spaces/periods
  const cleaned = upper.replace(/[\.\s]+$/, '');
  if (EMPLOYEE_MAP[cleaned]) return EMPLOYEE_MAP[cleaned];
  return null;
}

// ─── Main Parser ─────────────────────────────────────────────────────────────

function parseExcel() {
  console.log('Reading Excel file...');
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[SHEET_NAME];
  const range = XLSX.utils.decode_range(ws['!ref']);
  console.log(`Sheet "${SHEET_NAME}": ${range.e.r + 1} rows x ${range.e.c + 1} cols\n`);

  const monthNames = Object.keys(MONTH_MAP);
  // All Spanish month names (for stop condition detection, even if not imported)
  const allMonthNames = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
  ];

  // Step 1: Find ALL month header rows
  const monthOccurrences = {}; // monthName -> [{ row, dayColumns: { day -> colIndex } }]

  for (let r = 0; r <= range.e.r; r++) {
    const cellA = getCellString(ws, r, 0);
    const upperA = cellA.toUpperCase();
    if (monthNames.includes(upperA)) {
      // Build day -> column mapping
      const dayColumns = {};
      let maxDay = 0;
      for (let c = 2; c <= range.e.c; c++) {
        const val = getCellValue(ws, r, c);
        if (val !== null && !isNaN(Number(val))) {
          const day = Number(val);
          // Only take first occurrence of each day number (avoid overflow from next month)
          if (day >= 1 && day <= 31 && !dayColumns[day]) {
            dayColumns[day] = c;
            if (day > maxDay) maxDay = day;
          }
        }
      }

      if (!monthOccurrences[upperA]) monthOccurrences[upperA] = [];
      monthOccurrences[upperA].push({ row: r, dayColumns, maxDay });
    }
  }

  // Step 2: For each month, take the LAST occurrence with full days
  const selectedMonths = {};
  for (const [monthName, occurrences] of Object.entries(monthOccurrences)) {
    // Filter to occurrences that have a reasonable number of days
    const { year, month } = MONTH_MAP[monthName];
    const daysInMonth = new Date(year, month, 0).getDate();

    // Find the last occurrence with the most days (ideally full month)
    let best = null;
    for (const occ of occurrences) {
      if (!best || occ.maxDay >= best.maxDay) {
        // Prefer later (last) occurrence when maxDay is same or better
        if (!best || occ.maxDay > best.maxDay || occ.row > best.row) {
          best = occ;
        }
      }
    }

    if (best && best.maxDay >= 20) { // At least 20 days = likely a real month
      selectedMonths[monthName] = best;
      console.log(`${monthName} -> row ${best.row}, days 1-${best.maxDay} (${occurrences.length} versions found, using last full)`);
    } else if (best) {
      console.log(`${monthName} -> SKIPPED (only ${best.maxDay} days, likely partial)`);
    }
  }

  console.log('');

  // Step 3: Parse employee shifts from each selected month
  const allShifts = [];    // { employee, date, shift }
  const allOccupancy = []; // { date, checkIns, checkOuts }
  const employeesFound = new Set();
  const unknownEmployees = new Set();
  const shiftCodeStats = {};
  const unknownCodes = {};

  for (const [monthName, monthInfo] of Object.entries(selectedMonths)) {
    const { year, month } = MONTH_MAP[monthName];
    const { row: headerRow, dayColumns } = monthInfo;

    console.log(`\nParsing ${monthName} ${year} (header at row ${headerRow})...`);

    // Scan rows below the header for employee data
    let r = headerRow + 1;
    let employeeCount = 0;
    let ocupancyFound = false;

    while (r <= range.e.r) {
      const cellA = getCellString(ws, r, 0);
      const cellB = getCellString(ws, r, 1);
      const upperA = cellA.toUpperCase();
      const upperB = cellB.toUpperCase();

      // Stop conditions: next month header (any Spanish month name)
      if (allMonthNames.includes(upperA)) break;

      // Check for Llegadas/Salidas (occupancy)
      if (upperA === 'LLEGADAS' || upperB === 'LLEGADAS' ||
          upperA.startsWith('LLEGADA') || upperB.startsWith('LLEGADA')) {
        // Parse check-ins
        const salidaRow = r + 1; // Salidas is typically the next row
        for (const [dayStr, col] of Object.entries(dayColumns)) {
          const day = Number(dayStr);
          const checkIns = Number(getCellValue(ws, r, col)) || 0;
          const checkOuts = Number(getCellValue(ws, salidaRow, col)) || 0;
          if (checkIns > 0 || checkOuts > 0) {
            allOccupancy.push({
              date: formatDate(year, month, day),
              checkIns,
              checkOuts,
            });
          }
        }
        ocupancyFound = true;
        r += 2; // Skip both Llegadas and Salidas rows
        continue;
      }

      if (upperA === 'SALIDAS' || upperB === 'SALIDAS' ||
          upperA.startsWith('SALIDA') || upperB.startsWith('SALIDA')) {
        r++;
        continue;
      }

      // Skip metadata rows (VERSION, Hab. IN, etc.)
      if (upperA.includes('VERSION') || upperB.includes('VERSION') ||
          upperA.includes('VERSIÓN') || upperB.includes('VERSIÓN') ||
          upperA.includes('HAB.') || upperB.includes('HAB.') ||
          upperA.startsWith('V') && upperA.length <= 3 && /^V\d/.test(upperA)) {
        r++;
        continue;
      }

      // Try to match employee name
      const empName = cellA || '';
      const normalizedName = normalizeEmployeeName(empName);

      if (normalizedName) {
        employeesFound.add(normalizedName);
        employeeCount++;

        // Parse shifts for each day
        for (const [dayStr, col] of Object.entries(dayColumns)) {
          const day = Number(dayStr);
          const rawShift = getCellString(ws, r, col);
          if (!rawShift) continue;

          const normalized = normalizeShiftCode(rawShift);
          if (!normalized) continue;

          const date = formatDate(year, month, day);
          allShifts.push({
            employee: normalizedName,
            date,
            code: normalized.code,
            start: normalized.start || null,
            end: normalized.end || null,
            absence: normalized.absence || false,
          });

          // Stats
          shiftCodeStats[normalized.code] = (shiftCodeStats[normalized.code] || 0) + 1;
        }
      } else if (empName && empName.length > 1 && !/^\d+$/.test(empName) &&
                 !['', 'LLEGADAS', 'SALIDAS', 'HAB.'].some(x => upperA.includes(x))) {
        // Check if it has shift data (to distinguish from noise rows)
        let hasData = false;
        for (const col of Object.values(dayColumns)) {
          if (getCellString(ws, r, col)) { hasData = true; break; }
        }
        if (hasData) {
          unknownEmployees.add(empName);
        }
      }

      r++;
    }

    console.log(`  Employees parsed: ${employeeCount}${ocupancyFound ? ', occupancy found' : ''}`);
  }

  return { allShifts, allOccupancy, employeesFound, unknownEmployees, shiftCodeStats, unknownCodes };
}

// ─── SQL Generation ──────────────────────────────────────────────────────────

function generateSQL(allShifts, allOccupancy, employeesFound) {
  const lines = [];

  lines.push('-- ============================================================================');
  lines.push('-- TurnoSmart Historical Shift Import');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Source: DATA_TURNOS REALES AGO25 A ABRIL26.xlsx`);
  lines.push(`-- Total shifts: ${allShifts.length}`);
  lines.push(`-- Total occupancy records: ${allOccupancy.length}`);
  lines.push('-- ============================================================================');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  // Step 1: Create a temp table to map employee names to IDs
  lines.push('-- Step 1: Map employee names to IDs');
  lines.push('CREATE TEMP TABLE _emp_map (display_name TEXT PRIMARY KEY, emp_id UUID);');
  lines.push('');

  // Sort so exact-name matches are inserted first (shorter names before longer ones
  // with same prefix, e.g. "Elena" before "Elena D.")
  const sortedNames = [...employeesFound].sort((a, b) => a.length - b.length || a.localeCompare(b));
  for (const name of sortedNames) {
    lines.push(`INSERT INTO _emp_map (display_name, emp_id)`);
    lines.push(`  SELECT ${sqlEscape(name)}, id FROM colaboradores`);
    lines.push(`  WHERE org_id = '${ORG_ID}'`);
    lines.push(`    AND nombre = ${sqlEscape(name)}`);
    lines.push(`  LIMIT 1;`);
    lines.push('');
  }

  // Verification query
  lines.push('-- Verify: all employees should have an ID');
  lines.push('DO $$');
  lines.push('DECLARE');
  lines.push('  missing TEXT;');
  lines.push('BEGIN');
  lines.push("  SELECT string_agg(display_name, ', ') INTO missing");
  lines.push('  FROM _emp_map WHERE emp_id IS NULL;');
  lines.push('  IF missing IS NOT NULL THEN');
  lines.push("    RAISE WARNING 'Missing employee IDs for: %', missing;");
  lines.push('  END IF;');
  lines.push('END $$;');
  lines.push('');

  // Step 2: Delete existing historical shifts in this date range
  const dates = allShifts.map(s => s.date);
  const minDate = dates.sort()[0];
  const maxDate = dates.sort()[dates.length - 1];

  lines.push(`-- Step 2: Delete existing historical shifts for this org in date range`);
  lines.push(`DELETE FROM calendar_shifts`);
  lines.push(`WHERE org_id = '${ORG_ID}'`);
  lines.push(`  AND is_historical = true`);
  lines.push(`  AND date BETWEEN '${minDate}' AND '${maxDate}';`);
  lines.push('');

  // Step 3: Insert shifts in batches
  lines.push('-- Step 3: Insert historical shifts');
  lines.push('');

  // Group shifts into batches of 200 for manageable SQL
  const BATCH_SIZE = 200;
  for (let i = 0; i < allShifts.length; i += BATCH_SIZE) {
    const batch = allShifts.slice(i, i + BATCH_SIZE);
    lines.push(`INSERT INTO calendar_shifts (org_id, employee_id, date, start_time, end_time, shift_name, color, source, locked, is_historical)`);
    lines.push(`VALUES`);

    const valueLines = batch.map((s, idx) => {
      const startTime = s.start ? sqlEscape(s.start) : 'NULL';
      const endTime = s.end ? sqlEscape(s.end) : 'NULL';
      const color = sqlEscape(getColor(s.code));
      const comma = idx < batch.length - 1 ? ',' : ';';
      return `  ('${ORG_ID}', (SELECT emp_id FROM _emp_map WHERE display_name = ${sqlEscape(s.employee)}), '${s.date}', ${startTime}, ${endTime}, ${sqlEscape(s.code)}, ${color}, 'historical', false, true)${comma}`;
    });

    lines.push(...valueLines);
    lines.push('');
  }

  // Step 4: Insert occupancy data
  if (allOccupancy.length > 0) {
    lines.push('-- Step 4: Delete existing occupancy for this org in date range');
    const occDates = allOccupancy.map(o => o.date).sort();
    const occMin = occDates[0];
    const occMax = occDates[occDates.length - 1];
    lines.push(`DELETE FROM daily_occupancy`);
    lines.push(`WHERE organization_id = '${ORG_ID}'`);
    lines.push(`  AND date BETWEEN '${occMin}' AND '${occMax}';`);
    lines.push('');

    lines.push('-- Step 5: Insert occupancy data');
    for (let i = 0; i < allOccupancy.length; i += BATCH_SIZE) {
      const batch = allOccupancy.slice(i, i + BATCH_SIZE);
      lines.push(`INSERT INTO daily_occupancy (organization_id, date, check_ins, check_outs, source)`);
      lines.push(`VALUES`);

      const valueLines = batch.map((o, idx) => {
        const comma = idx < batch.length - 1 ? ',' : ';';
        return `  ('${ORG_ID}', '${o.date}', ${o.checkIns}, ${o.checkOuts}, 'excel')${comma}`;
      });

      lines.push(...valueLines);
      lines.push('');
    }
  }

  // Step 6: Cleanup
  lines.push('-- Cleanup');
  lines.push('DROP TABLE IF EXISTS _emp_map;');
  lines.push('');
  lines.push('COMMIT;');
  lines.push('');

  // Summary as comment
  lines.push('-- ============================================================================');
  lines.push('-- SUMMARY');
  lines.push(`-- Shifts inserted: ${allShifts.length}`);
  lines.push(`-- Occupancy records: ${allOccupancy.length}`);
  lines.push(`-- Date range: ${minDate} to ${maxDate}`);
  lines.push(`-- Employees: ${[...employeesFound].sort().join(', ')}`);
  lines.push('-- ============================================================================');

  return lines.join('\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log('=== TurnoSmart Historical Shift Import ===\n');

  const { allShifts, allOccupancy, employeesFound, unknownEmployees, shiftCodeStats } = parseExcel();

  console.log('\n=== SUMMARY ===');
  console.log(`Total shifts extracted: ${allShifts.length}`);
  console.log(`Total occupancy records: ${allOccupancy.length}`);
  console.log(`\nEmployees found (${employeesFound.size}):`);
  for (const name of [...employeesFound].sort()) {
    const count = allShifts.filter(s => s.employee === name).length;
    console.log(`  ${name}: ${count} shifts`);
  }

  if (unknownEmployees.size > 0) {
    console.log(`\nUnknown employee names (${unknownEmployees.size}):`);
    for (const name of unknownEmployees) {
      console.log(`  "${name}"`);
    }
  }

  console.log(`\nShift code distribution:`);
  for (const [code, count] of Object.entries(shiftCodeStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${code}: ${count}`);
  }

  // Date range
  const dates = allShifts.map(s => s.date).sort();
  if (dates.length > 0) {
    console.log(`\nDate range: ${dates[0]} to ${dates[dates.length - 1]}`);
  }

  // Per-month stats
  console.log(`\nPer-month breakdown:`);
  const monthCounts = {};
  for (const s of allShifts) {
    const ym = s.date.substring(0, 7);
    monthCounts[ym] = (monthCounts[ym] || 0) + 1;
  }
  for (const [ym, count] of Object.entries(monthCounts).sort()) {
    console.log(`  ${ym}: ${count} shifts`);
  }

  // Generate SQL
  console.log(`\nGenerating SQL...`);
  const sql = generateSQL(allShifts, allOccupancy, employeesFound);
  writeFileSync(OUTPUT_PATH, sql, 'utf-8');
  console.log(`SQL written to: ${OUTPUT_PATH}`);
  console.log(`File size: ${(sql.length / 1024).toFixed(1)} KB`);
}

main();
