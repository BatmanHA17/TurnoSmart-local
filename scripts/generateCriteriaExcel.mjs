/**
 * Script para generar el Excel de criterios SMART desde criteriaDefaults.ts
 * Ejecutar: node scripts/generateCriteriaExcel.mjs
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Dynamic import of xlsx
const XLSX = require("xlsx");

// ---- Inline criteria data (from criteriaDefaults.ts) ----
// We'll read the TS file and extract the data

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsPath = resolve(__dirname, "../src/data/criteriaDefaults.ts");
const tsContent = readFileSync(tsPath, "utf-8");

// Parse criteria from TS file using regex
function extractCriteria(content, arrayName) {
  const regex = new RegExp(`export const ${arrayName}[^=]*=\\s*\\[([\\s\\S]*?)\\];`, "m");
  const match = content.match(regex);
  if (!match) return [];

  const arrayContent = match[1];
  const criteria = [];

  // Match each object block
  const objRegex = /\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let objMatch;
  while ((objMatch = objRegex.exec(arrayContent)) !== null) {
    const block = objMatch[1];
    const get = (key) => {
      const r = new RegExp(`${key}:\\s*(?:"([^"]*)"|'([^']*)'|(\d+(?:\.\d+)?)|(\w+))`, "m");
      const m = block.match(r);
      if (!m) return "";
      return m[1] ?? m[2] ?? m[3] ?? m[4] ?? "";
    };

    const code = get("code");
    if (!code) continue;

    criteria.push({
      "Codigo": code,
      "Clave": get("key"),
      "Nombre": get("name") || extractQuotedString(block, "name"),
      "Descripcion": extractQuotedString(block, "description"),
      "Categoria": get("category"),
      "Subcategoria": get("subcategory") || extractQuotedString(block, "subcategory"),
      "Severidad": get("severity"),
      "Activo por defecto": get("defaultEnabled") === "true" ? "SI" : "NO",
      "Boost": get("defaultBoost"),
    });
  }
  return criteria;
}

function extractQuotedString(block, key) {
  const r = new RegExp(`${key}:\\s*"([^"]*(?:"[^"]*)*)"`, "m");
  const m = block.match(r);
  if (m) return m[1];
  const r2 = new RegExp(`${key}:\\s*'([^']*)'`, "m");
  const m2 = block.match(r2);
  return m2 ? m2[1] : "";
}

const OBLIGATORIOS = extractCriteria(tsContent, "OBLIGATORIOS");
const OPCIONALES = extractCriteria(tsContent, "OPCIONALES");
const CHECKS = extractCriteria(tsContent, "CHECKS");
const SMART_IA = extractCriteria(tsContent, "SMART_IA");

console.log(`Parsed: OB=${OBLIGATORIOS.length}, OP=${OPCIONALES.length}, CK=${CHECKS.length}, SM=${SMART_IA.length}`);
console.log(`Total: ${OBLIGATORIOS.length + OPCIONALES.length + CHECKS.length + SMART_IA.length}`);

// Create workbook
const wb = XLSX.utils.book_new();

function addSheet(name, data, color) {
  if (data.length === 0) {
    console.warn(`No data for sheet ${name}`);
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws["!cols"] = [
    { wch: 8 },   // Codigo
    { wch: 35 },  // Clave
    { wch: 50 },  // Nombre
    { wch: 100 }, // Descripcion
    { wch: 12 },  // Categoria
    { wch: 25 },  // Subcategoria
    { wch: 10 },  // Severidad
    { wch: 16 },  // Activo
    { wch: 6 },   // Boost
  ];

  XLSX.utils.book_append_sheet(wb, ws, name);
}

addSheet("OB - Obligatorios (18)", OBLIGATORIOS);
addSheet("OP - Opcionales (43)", OPCIONALES);
addSheet("CK - Checks (27)", CHECKS);
addSheet("SM - SMART+IA (10)", SMART_IA);

// Summary sheet
const summary = [
  { "Categoria": "Obligatorios (OB)", "Cantidad": OBLIGATORIOS.length, "Toggle": "Siempre ON", "Descripcion": "Ley laboral + convenio + organizacion" },
  { "Categoria": "Opcionales (OP)", "Cantidad": OPCIONALES.length, "Toggle": "ON/OFF + Boost 1-5", "Descripcion": "Personalizables por el FOM" },
  { "Categoria": "Checks (CK)", "Cantidad": CHECKS.length, "Toggle": "ON/OFF", "Descripcion": "Validaciones pre/post generacion" },
  { "Categoria": "SMART+IA (SM)", "Cantidad": SMART_IA.length, "Toggle": "ON/OFF", "Descripcion": "Inteligencia proactiva" },
  { "Categoria": "TOTAL", "Cantidad": OBLIGATORIOS.length + OPCIONALES.length + CHECKS.length + SMART_IA.length, "Toggle": "", "Descripcion": "" },
];
const wsSummary = XLSX.utils.json_to_sheet(summary);
wsSummary["!cols"] = [{ wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 60 }];
XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

// Write file
const outputPath = resolve("/Users/josegalvan/Desktop/TurnoSmart_Criterios_SMART.xlsx");
XLSX.writeFile(wb, outputPath);
console.log(`\nExcel generado: ${outputPath}`);
console.log("Hojas: Resumen, OB, OP, CK, SM");
