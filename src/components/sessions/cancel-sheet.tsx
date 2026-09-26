"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmojiTile, InfoNote } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { Booking } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { bookingInfo } from "./booking-utils";

/** Yozilishni bekor qilishdan oldin tasdiqlash oynasi */
export function CancelBookingSheet({ booking, onClose, onDone }: { booking: Booking | null; onClose: () => void; onDone?: () => void }) {
  const act = useApp((s) => s.act);
  const [busy, setBusy] = useState(false);
  const info = booking ? bookingInfo(booking) : null;

  async function confirm() {
    if (!booking || busy) return;
    setBusy(true);
    try {
      const r = await act({ type: "booking.cancel", bookingId: booking.id });
      if (r.ok) {
        haptic("success");
        toast.success(booking.kind === "session" ? "Yozilish bekor qilindi — joy boshqa oilaga bo‘shadi" : "Konsultatsiya bekor qilindi", "🗓️");
        onDone?.();
        onClose();
      } else {
        toast.error(r.error ?? "Bekor qilib bo‘lmadi");
      }
    } catch {
      toast.error("Internet aloqasini tekshirib, qayta urinib ko‘ring");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={!!booking}
      onClose={onClose}
      title="Yozilishni bekor qilasizmi?"
      size="sm"
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={onClose} disabled={busy}>
            Yo‘q, qoldirish
          </Button>
          <Button variant="danger" block loading={busy} onClick={confirm}>
            Ha, bekor qilish
          </Button>
        </div>
      }
    >
      {booking && info && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <EmojiTile emoji={info.emoji} color={`${info.color}1f`} size={46} />
            <div className="min-w-0">
              <div className="line-clamp-2 font-extrabold leading-snug text-ink">{info.title}</div>
              <div className="mt-0.5 text-sm font-semibold text-muted">
                {formatDate(booking.date, { weekday: true })}, {booking.time}
              </div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            {booking.kind === "session"
              ? "Joyingiz navbatdagi oilaga beriladi. Joy bo‘lsa, keyinroq qayta yozilishingiz mumkin."
              : "Bu vaqt boshqa oilalar uchun bo‘shatiladi. Istalgan payt yangi vaqtga yozilishingiz mumkin."}
          </p>
          {booking.premium && <InfoNote emoji="💎">Premium bo‘yicha bepul konsultatsiyangiz qaytariladi.</InfoNote>}
        </div>
      )}
    </Sheet>
  );
}
