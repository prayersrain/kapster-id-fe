'use client';

import { useLayoutEffect } from 'react';

export function MotionEffects() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const items = Array.from(document.querySelectorAll<HTMLElement>('.motion-reveal'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(item => { item.dataset.revealed = 'true'; });
      return;
    }

    root.classList.add('motion-enabled');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.revealed = 'true';
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    const revealFocusedItem = (event: FocusEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>('.motion-reveal');
      if (!target) return;
      target.dataset.revealed = 'true';
      observer.unobserve(target);
    };

    items.forEach(item => observer.observe(item));
    document.addEventListener('focusin', revealFocusedItem);

    return () => {
      document.removeEventListener('focusin', revealFocusedItem);
      observer.disconnect();
      root.classList.remove('motion-enabled');
    };
  }, []);

  return null;
}
