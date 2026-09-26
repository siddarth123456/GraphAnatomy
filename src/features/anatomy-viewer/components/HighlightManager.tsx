import { useEffect, ReactNode } from 'react';
import { useAppStore } from '@/store/useAppStore';

/** Materials handle highlights; this keeps pointer feedback consistent on unmount. */
export function HighlightManager({ children }: { children: ReactNode }) {
  const hoveredMeshId = useAppStore((state) => state.hoveredMeshId);
  useEffect(() => {
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = hoveredMeshId ? 'pointer' : '';
    return () => { document.body.style.cursor = previousCursor; };
  }, [hoveredMeshId]);
  return <>{children}</>;
}
