"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger offset in milliseconds, applied through the `--atl-delay` var. */
  delay?: number;
  className?: string;
}

/**
 * Fades and lifts its children once they enter the viewport.
 *
 * The motion itself lives in CSS (`.atl-reveal`), so with JavaScript disabled
 * or `prefers-reduced-motion: reduce` the content renders normally — the
 * reduced-motion block in `landing.css` overrides both opacity and transform.
 */
export default function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className ? `atl-reveal ${className}` : "atl-reveal"}
      data-in={visible ? "true" : "false"}
      style={{ "--atl-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
