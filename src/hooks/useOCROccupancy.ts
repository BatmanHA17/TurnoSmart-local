/**
 * B4-2: OCR Foto PMS — Hook placeholder para extracción de ocupación desde foto
 *
 * Fase futura: integrar con servicio OCR (Tesseract.js, Google Vision, o Claude Vision)
 * para extraer check-in/check-out de una captura de pantalla del PMS.
 *
 * Flujo previsto:
 * 1. Usuario toma foto del PMS o hace captura de pantalla
 * 2. Sube imagen al componente
 * 3. El hook envía la imagen al servicio OCR
 * 4. Recibe datos estructurados: [{day, checkIns, checkOuts}]
 * 5. Preview + confirmación → importar a daily_occupancy
 */

import { useState, useCallback } from "react";

export interface OCRResult {
  day: number;
  checkIns: number;
  checkOuts: number;
  confidence: number; // 0-1
}

interface UseOCROccupancyReturn {
  /** Procesar una imagen para extraer datos de ocupación */
  processImage: (file: File) => Promise<OCRResult[]>;
  /** Resultado del último procesamiento */
  results: OCRResult[];
  /** Estado de procesamiento */
  isProcessing: boolean;
  /** Error del último procesamiento */
  error: string | null;
}

export function useOCROccupancy(): UseOCROccupancyReturn {
  const [results, setResults] = useState<OCRResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(async (file: File): Promise<OCRResult[]> => {
    setIsProcessing(true);
    setError(null);
    setResults([]);

    try {
      // TODO: Integrar con servicio OCR real
      // Opciones:
      // 1. Tesseract.js (client-side, gratuito, menor precisión)
      // 2. Google Cloud Vision API (server-side, alta precisión, coste)
      // 3. Claude Vision API (server-side, alta precisión, coste)
      //
      // Por ahora: placeholder que devuelve error informativo
      throw new Error(
        "OCR no disponible todavía. Usa la importación CSV o introduce los datos manualmente."
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { processImage, results, isProcessing, error };
}
