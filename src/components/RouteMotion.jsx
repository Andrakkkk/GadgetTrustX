'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';

export default function RouteMotion({ children }) {
  const rootRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    // Single clean page-level animation — no child animations to avoid double bounce
    const tween = gsap.fromTo(
      root,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      }
    );

    return () => {
      tween.kill();
    };
  }, [pathname]);

  return (
    <div ref={rootRef}>
      {children}
    </div>
  );
}
