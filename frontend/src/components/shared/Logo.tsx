"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

const sizes = {
  sm: { icon: 24, text: "text-base",  gap: "gap-2" },
  md: { icon: 30, text: "text-xl",    gap: "gap-2.5" },
  lg: { icon: 38, text: "text-2xl",   gap: "gap-3" },
};

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 38 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagon */}
      <path
        d="M19 2L35 11V27L19 36L3 27V11L19 2Z"
        stroke="var(--accent)"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Inner trace lines — signal / stack metaphor */}
      <path
        d="M11 15h5l2 4 4-8 2 4h3"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom dot — incident marker */}
      <circle cx="19" cy="26" r="1.5" fill="var(--accent)" />
    </svg>
  );
}

export default function Logo({
  size = "md",
  href = "/",
  className,
}: LogoProps) {
  const s = sizes[size];

  const content = (
    <span
      className={cn(
        "inline-flex items-center select-none",
        s.gap,
        className
      )}
    >
      <LogoMark size={s.icon} />
      <span
        style={{ fontFamily: "var(--font-display)" }}
        className={cn(s.text, "font-bold tracking-tight")}
      >
        Trace
        <span style={{ color: "var(--accent)" }}>Agent</span>
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="inline-flex items-center no-underline hover:opacity-90 transition-opacity"
    >
      {content}
    </Link>
  );
}