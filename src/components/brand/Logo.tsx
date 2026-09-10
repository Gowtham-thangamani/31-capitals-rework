import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official brand artwork (light variant, for dark backgrounds), trimmed from the
 * supplied logo pack. The mark is decorative wherever it sits beside the wordmark;
 * the wordmark carries the accessible name.
 */

/**
 * The mark is the colour artwork, which carries the brand orange. The wordmark uses
 * the light artwork because the colour version's "t" accent is dark maroon and would
 * disappear against the near-black background.
 */
const MARK = { src: "/brand/logo-icon-color.png", width: 1067, height: 720 };
const WORDMARK = { src: "/brand/logo-wordmark.png", width: 1670, height: 314 };
// The light wordmark is white lettering; on a light background it needs the
// colour variant instead, whose "t" accent is dark enough to read.
const WORDMARK_DARK = { src: "/brand/logo-wordmark-dark.png", width: 1670, height: 314 };

export function DiamondMark({
  className,
  priority = false,
  alt = "",
}: {
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    <Image
      {...MARK}
      alt={alt}
      aria-hidden={alt === "" ? true : undefined}
      priority={priority}
      className={cn("object-contain", className)}
    />
  );
}

export function Wordmark({
  className,
  priority = false,
  onLight = false,
}: {
  className?: string;
  priority?: boolean;
  /** Use the dark lettering, for placement on a light background. */
  onLight?: boolean;
}) {
  return (
    <Image
      {...(onLight ? WORDMARK_DARK : WORDMARK)}
      alt="31 Capitals"
      priority={priority}
      className={cn("object-contain", className)}
    />
  );
}

export function Logo({
  className,
  markClassName,
  wordmarkClassName,
  wordmark = true,
  priority = false,
  onLight = false,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  wordmark?: boolean;
  priority?: boolean;
  onLight?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <DiamondMark className={cn("h-8 w-auto", markClassName)} priority={priority} />
      {wordmark ? (
        <Wordmark className={cn("h-5 w-auto", wordmarkClassName)} priority={priority} onLight={onLight} />
      ) : (
        <span className="sr-only">31 Capitals</span>
      )}
    </span>
  );
}
