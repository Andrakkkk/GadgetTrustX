'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const animatedSelector = [
  'h1',
  'h2',
  '.glass-panel',
  '.card-hover',
  'aside',
].join(', ');

export default function RouteMotion({ children }) {
  const rootRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!rootRef.current || pathname === '/') return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    let context;
    let observer;
    const timer = window.setTimeout(() => {
      const root = rootRef.current;
      if (!root) return;

      const animatedNodes = new WeakSet();

      context = gsap.context(() => {
        gsap.fromTo(
          root,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power3.out',
            clearProps: 'opacity,transform',
          }
        );

        const animateNode = (node) => {
          if (!(node instanceof HTMLElement) || animatedNodes.has(node)) return;
          animatedNodes.add(node);

          gsap.fromTo(
            node,
            { opacity: 0, y: 24, scale: 0.985 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.65,
              ease: 'power3.out',
              clearProps: 'opacity,transform',
              scrollTrigger: {
                trigger: node,
                start: 'top 92%',
                once: true,
              },
            }
          );
        };

        root.querySelectorAll(animatedSelector).forEach(animateNode);

        observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (!(node instanceof HTMLElement)) return;
              if (node.matches(animatedSelector)) animateNode(node);
              node.querySelectorAll?.(animatedSelector).forEach(animateNode);
            });
          });
          ScrollTrigger.refresh();
        });

        observer.observe(root, { childList: true, subtree: true });
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }, root);
    }, 100);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      context?.revert();
    };
  }, [pathname]);

  return (
    <div ref={rootRef}>
      {children}
    </div>
  );
}
