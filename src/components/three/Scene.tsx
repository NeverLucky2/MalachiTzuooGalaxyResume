'use client';
import type {NavState, NavAction} from '@/lib/navigation';
// Placeholder — replaced with the real 3D scene in a later task.
export function Scene(_props: {nav: NavState; dispatch: React.Dispatch<NavAction>}) {
  return <div data-testid="scene-placeholder" className="fixed inset-0 z-10" />;
}
