import { useId } from "react";
import { cn } from "@/lib/utils";

/** YuniQo logotipi — osmon rang kvadrat va o‘sish chizig‘i */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  const gid = `yq-g-${useId().replace(/:/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gid})`} />
      <path d="M19 43 L30 29 L35 37 L46 20" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="19" cy="43" r="3.6" fill="#fff" />
      <circle cx="46" cy="20" r="3.6" fill="#fff" />
    </svg>
  );
}

export function Logo({ className, size = 36, tagline }: { className?: string; size?: number; tagline?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <div className="leading-none">
        <div className="font-black tracking-tight text-ink" style={{ fontSize: size * 0.56 }}>
          YuniQo
        </div>
        {tagline && <div className="mt-1 text-[11px] font-semibold text-muted">Har bir bola uchun imkoniyat</div>}
      </div>
    </div>
  );
}
