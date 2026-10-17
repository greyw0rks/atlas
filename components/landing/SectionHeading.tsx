import type { ReactNode } from "react";
import Reveal from "./Reveal";

interface SectionHeadingProps {
  /** Section number as printed in the reference design (01–06). */
  number: string;
  /** Short label beside the number. */
  label: string;
  title: ReactNode;
  lede?: ReactNode;
  /** Heading level — hero uses h1, every other section h2. */
  as?: "h1" | "h2";
}

/**
 * The shared section chrome: number, label, hairline rule, then the heading.
 * Keeping it in one place is what makes six very different illustrations still
 * read as one document.
 */
export default function SectionHeading({
  number,
  label,
  title,
  lede,
  as: Heading = "h2",
}: SectionHeadingProps) {
  return (
    <Reveal>
      <div className="flex items-center gap-4">
        <span className="atl-section-num">{number}</span>
        <span className="atl-section-label">{label}</span>
        <span className="atl-hairline" aria-hidden="true" />
      </div>
      <Heading className="atl-display mt-6 text-[clamp(1.9rem,4.2vw,3rem)]">
        {title}
      </Heading>
      {lede ? <p className="atl-lede mt-4 max-w-[52ch]">{lede}</p> : null}
    </Reveal>
  );
}
