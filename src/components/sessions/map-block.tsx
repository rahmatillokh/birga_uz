"use client";

import { Copy, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openExternal } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import { cn } from "@/lib/utils";

/** Xarita uslubidagi manzil bloki (tashqi xaritani ochish tugmasi bilan) */
export function MapBlock({
  title,
  address,
  query,
  color = "#0ea5e9",
  className,
}: {
  title: string;
  address: string;
  query?: string;
  color?: string;
  className?: string;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${title}, ${address}`);
      toast.success("Manzil nusxalandi", "📋");
    } catch {
      toast.info(address, "📍");
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-line bg-white", className)}>
      <div
        className="relative h-36 sm:h-40"
        style={{
          backgroundColor: "#eaf2f8",
          backgroundImage: [
            "radial-gradient(circle at 18% 28%, #d3ecda 0 13%, transparent 14%)",
            "radial-gradient(circle at 84% 78%, #d3ecda 0 11%, transparent 12%)",
            "linear-gradient(90deg, transparent 46%, #ffffff 46%, #ffffff 51%, transparent 51%)",
            "linear-gradient(0deg, transparent 38%, #ffffff 38%, #ffffff 44%, transparent 44%)",
            "linear-gradient(28deg, transparent 74%, #ffffff 74%, #ffffff 77%, transparent 77%)",
            "linear-gradient(rgb(14 165 233 / 0.07) 1px, transparent 1px)",
            "linear-gradient(90deg, rgb(14 165 233 / 0.07) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 20px 20px, 20px 20px",
        }}
        aria-hidden
      >
        <div className="absolute left-[48.5%] top-[59%] -translate-x-1/2 -translate-y-full">
          <div className="flex flex-col items-center">
            <span className="relative grid h-11 w-11 place-items-center">
              <span className="absolute inset-0 animate-pulse-ring rounded-full" />
              <span
                className="relative grid h-11 w-11 place-items-center rounded-full text-white shadow-pop ring-4 ring-white"
                style={{ background: color }}
              >
                <MapPin className="h-5 w-5" />
              </span>
            </span>
            <span className="-mt-1.5 h-3 w-3 rotate-45 rounded-sm" style={{ background: color }} />
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3 p-3.5">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <MapPin className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold leading-snug text-ink">{title}</div>
          <div className="mt-0.5 text-sm leading-snug text-muted">{address}</div>
        </div>
      </div>
      <div className="flex gap-2 border-t border-line px-3.5 py-2.5">
        <Button
          size="sm"
          variant="soft"
          onClick={() => openExternal(`https://yandex.uz/maps/?text=${encodeURIComponent(query ?? `${title}, ${address}`)}`)}
        >
          <Navigation className="h-4 w-4" />
          Xaritada ochish
        </Button>
        <Button size="sm" variant="ghost" onClick={copy}>
          <Copy className="h-4 w-4" />
          Nusxalash
        </Button>
      </div>
    </div>
  );
}
