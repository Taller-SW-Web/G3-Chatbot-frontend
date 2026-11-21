"use client";

import { useState } from "react";
import Image from "next/image";

type BrandLogoProps = {
  variant?: "volt" | "negro";
  className?: string;
};

const SRC = {
  volt: { src: "/logos/inka-volt-sinfondo.png", w: 1334, h: 406 },
  negro: { src: "/logos/inka-negro-sinfondo.png", w: 1306, h: 368 },
} as const;

/** Logo Inka Athletics (1448×1086) con fallback a wordmark en texto si no carga. */
export function BrandLogo({ variant = "volt", className = "h-7 w-auto" }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`font-heading uppercase tracking-[0.08em] ${variant === "volt" ? "text-text-inverse" : "text-text-primary"}`}>
        INKA <span className={variant === "volt" ? "text-accent-volt" : "text-ember"}>ATHLETICS</span>
      </span>
    );
  }

  return (
    <Image
      src={SRC[variant].src}
      alt="Inka Athletics"
      width={SRC[variant].w}
      height={SRC[variant].h}
      priority={variant === "volt"}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
