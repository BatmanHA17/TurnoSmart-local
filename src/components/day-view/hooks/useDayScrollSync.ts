import { useRef, useCallback, useEffect } from "react";

export function useDayScrollSync() {
  const gridRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  const onGridScroll = useCallback(() => {
    const g = gridRef.current;
    if (!g) return;
    
    if (topRef.current && topRef.current.scrollLeft !== g.scrollLeft) {
      topRef.current.scrollLeft = g.scrollLeft; // Sync X
    }
    if (leftRef.current && leftRef.current.scrollTop !== g.scrollTop) {
      leftRef.current.scrollTop = g.scrollTop; // Sync Y
    }
  }, []);

  const onTopScroll = useCallback(() => {
    const t = topRef.current;
    const g = gridRef.current;
    if (!g || !t) return;
    
    if (g.scrollLeft !== t.scrollLeft) {
      g.scrollLeft = t.scrollLeft;
    }
  }, []);

  const onLeftScroll = useCallback(() => {
    const l = leftRef.current;
    const g = gridRef.current;
    if (!g || !l) return;
    
    if (g.scrollTop !== l.scrollTop) {
      g.scrollTop = l.scrollTop;
    }
  }, []);

  // Soporte para Shift+Wheel = scroll horizontal
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey && gridRef.current) {
        e.preventDefault();
        gridRef.current.scrollLeft += e.deltaY;
      }
    };

    const grid = gridRef.current;
    if (grid) {
      grid.addEventListener('wheel', handleWheel, { passive: false });
      return () => grid.removeEventListener('wheel', handleWheel);
    }
  }, []);

  return { 
    gridRef, 
    topRef, 
    leftRef, 
    onGridScroll, 
    onTopScroll, 
    onLeftScroll 
  };
}
