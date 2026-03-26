import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export const ZOOM_LEVELS = {
  1: { label: "Compacto", pxPerHour: 60 },     // 60px/hora
  2: { label: "Normal", pxPerHour: 120 },      // 120px/hora (default)
  3: { label: "Detallado", pxPerHour: 180 }    // 180px/hora
} as const;

export type ZoomLevel = keyof typeof ZOOM_LEVELS;

export function useDayZoom() {
  const [searchParams, setSearchParams] = useSearchParams();
  const zoomParam = searchParams.get("zoom");
  
  const [zoomLevel, setZoomLevelState] = useState<ZoomLevel>(() => {
    const parsed = parseInt(zoomParam || "2");
    return (parsed === 1 || parsed === 2 || parsed === 3) ? parsed as ZoomLevel : 2;
  });

  const pxPerMinute = ZOOM_LEVELS[zoomLevel].pxPerHour / 60;
  const pxPerSlot = pxPerMinute * 15; // 15 min slot

  const setZoomLevel = useCallback((level: ZoomLevel) => {
    setZoomLevelState(level);
    const params = new URLSearchParams(searchParams);
    params.set("zoom", level.toString());
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const zoomIn = useCallback(() => {
    if (zoomLevel < 3) setZoomLevel((zoomLevel + 1) as ZoomLevel);
  }, [zoomLevel, setZoomLevel]);

  const zoomOut = useCallback(() => {
    if (zoomLevel > 1) setZoomLevel((zoomLevel - 1) as ZoomLevel);
  }, [zoomLevel, setZoomLevel]);

  return {
    zoomLevel,
    pxPerMinute,
    pxPerSlot,
    pxPerHour: ZOOM_LEVELS[zoomLevel].pxPerHour,
    zoomIn,
    zoomOut,
    setZoomLevel
  };
}
