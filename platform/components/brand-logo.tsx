interface BrandLogoProps {
  variant?: "light" | "dark";
  size?: "sm" | "md";
}

export function BrandLogo({ variant = "light", size = "md" }: BrandLogoProps) {
  const isDark = variant === "dark";
  const textSize = size === "sm" ? "text-[15px]" : "text-[18px]";

  return (
    <span className={`flex items-baseline leading-none select-none ${textSize}`}>
      <span className={`font-medium tracking-tight ${isDark ? "text-white/80" : "text-[var(--th-fg)]"}`}>
        foglalj&nbsp;
      </span>
      <span className={`font-bold tracking-[-0.03em] ${isDark ? "text-white" : "text-[var(--th-accent)]"}`}>
        edzőt
      </span>
    </span>
  );
}
