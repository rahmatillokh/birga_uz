"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Chips } from "@/components/ui/tabs";
import { useView } from "@/lib/client/hooks";
import type { Booking } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BookingCard } from "./booking-card";
import { isUpcoming, sortByTime } from "./booking-utils";

type KindFilter = "all" | "session" | "consultation";

/** "Mening yozilishlarim": yaqinlashayotganlar birinchi, o‘tganlari yig‘ilgan holda */
export function MyBookings({
  onOpenSession,
  onCancel,
  onBrowse,
}: {
  onOpenSession: (sessionId: string) => void;
  onCancel: (b: Booking) => void;
  onBrowse: () => void;
}) {
  const bookings = useView().bookings;
  const [kind, setKind] = useState<KindFilter>("all");
  const [showPast, setShowPast] = useState(false);

  const { upcoming, past } = useMemo(() => {
    const list = kind === "all" ? bookings : bookings.filter((b) => b.kind === kind);
    return {
      upcoming: list.filter(isUpcoming).sort(sortByTime),
      past: list.filter((b) => !isUpcoming(b)).sort((a, b) => sortByTime(b, a)),
    };
  }, [bookings, kind]);

  if (!bookings.length) {
    return (
      <EmptyState
        className="mt-4"
        emoji="📅"
        title="Hali yozilishlar yo‘q"
        text="Tumaningizdagi bepul sessiyaga yoki mutaxassis konsultatsiyasiga yoziling — barchasi shu yerda ko‘rinadi."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onBrowse}>🏢 Bepul sessiyalar</Button>
            <Button variant="secondary" href="/specialists">
              👨‍⚕️ Mutaxassislar
            </Button>
          </div>
        }
      />
    );
  }

  const counts = {
    all: bookings.filter(isUpcoming).length,
    session: bookings.filter((b) => b.kind === "session" && isUpcoming(b)).length,
    consultation: bookings.filter((b) => b.kind === "consultation" && isUpcoming(b)).length,
  };

  return (
    <div className="mt-4">
      <Chips<KindFilter>
        value={kind}
        onChange={setKind}
        items={[
          { value: "all", label: `Barchasi · ${counts.all}` },
          { value: "session", label: `Sessiyalar · ${counts.session}`, emoji: "🏢" },
          { value: "consultation", label: `Konsultatsiyalar · ${counts.consultation}`, emoji: "👨‍⚕️" },
        ]}
      />

      <div className="mt-3">
        {upcoming.length ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} onCancel={onCancel} onOpenSession={onOpenSession} />
            ))}
          </div>
        ) : (
          <EmptyState
            emoji="🗓️"
            title="Yaqin kunlarda uchrashuv yo‘q"
            text="Yangi sessiya yoki konsultatsiyaga yozilishingiz mumkin."
            className="py-8"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={onBrowse}>
                  🏢 Sessiyalar
                </Button>
                <Button size="sm" variant="secondary" href="/specialists">
                  👨‍⚕️ Mutaxassislar
                </Button>
              </div>
            }
          />
        )}
      </div>

      {past.length > 0 && (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            aria-expanded={showPast}
            className="flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-2.5 text-left transition hover:border-brand-200"
          >
            <span className="text-[15px] font-extrabold text-ink-2">
              🗂️ O‘tgan va bekor qilinganlar <span className="text-muted">({past.length})</span>
            </span>
            <ChevronDown className={cn("h-5 w-5 text-muted transition-transform", showPast && "rotate-180")} />
          </button>
          {showPast && (
            <div className="mt-3 grid animate-fade-up grid-cols-1 gap-3 lg:grid-cols-2">
              {past.map((b) => (
                <BookingCard key={b.id} booking={b} onOpenSession={onOpenSession} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
