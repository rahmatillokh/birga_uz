import { CheckCircle2, Clock3, History, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/lib/types";
import { STATUS_META } from "./booking-utils";

const ICONS: Record<BookingStatus, typeof Clock3> = {
  kutilmoqda: Clock3,
  tasdiqlandi: CheckCircle2,
  bekor: XCircle,
  otdi: History,
};

/** Yozilish holati: kutilmoqda / tasdiqlandi / bekor / o‘tdi */
export function BookingStatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const meta = STATUS_META[status];
  const Icon = ICONS[status];
  return (
    <Badge tone={meta.tone} className={className}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </Badge>
  );
}
