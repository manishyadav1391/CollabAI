"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Mirrors the site-wide [data-reveal] scroll-in behavior: content already on
 * screen at mount stays visible, only below-the-fold blocks fade/rise in.
 */
export function Reveal({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: keyof HTMLElementTagNameMap;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    el.style.transition = "opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1)";
    if (rect.top <= window.innerHeight * 0.92) return;

    el.style.opacity = "0";
    el.style.transform = "translateY(26px)";

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "none";
            io.unobserve(el);
          }
        });
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = Tag as "div";
  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  );
}
