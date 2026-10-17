"use client";

import { safeImageUrl } from "@/domain/entities/CatalogoUI";
import { sanitize } from "@/domain/utils/sanitize";

/** Imagen de producto: `<img>` solo si la URL es http/https, si no placeholder. */
export function ProductImage({
  src,
  alt,
  className = "",
  emojiClassName = "text-[32px]",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  emojiClassName?: string;
}) {
  const safe = safeImageUrl(src);
  const label = sanitize(alt);

  if (safe) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={safe}
        alt={label}
        loading="lazy"
        decoding="async"
        className={`object-cover rounded-md ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-md flex items-center justify-center p-2 ${emojiClassName} ${className}`}
      style={{
        background:
          "linear-gradient(135deg, var(--color-surface-ink-soft), var(--color-accent-signal-soft), var(--color-surface-ink))",
      }}
      role="img"
      aria-label={label}
    >
      <span
        aria-hidden
        className="absolute top-0 right-0 w-10 h-10 bg-accent-volt"
        style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
      />
      <span aria-hidden>👟</span>
    </div>
  );
}
