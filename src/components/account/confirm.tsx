"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

export interface ConfirmOptions {
  title: string;
  text?: React.ReactNode;
  emoji?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger" | "premium";
}

/**
 * Tasdiqlash oynasi (window.confirm o‘rniga — Telegram ichida ham chiroyli ishlaydi).
 *   const [confirm, confirmUi] = useConfirm();
 *   if (await confirm({ title: "…" })) { … }
 *   return <>{…}{confirmUi}</>;
 */
export function useConfirm() {
  const [req, setReq] = useState<{ opts: ConfirmOptions; resolve: (ok: boolean) => void } | null>(null);

  const confirm = useCallback(
    (opts: ConfirmOptions) => new Promise<boolean>((resolve) => setReq({ opts, resolve })),
    [],
  );

  const close = (ok: boolean) => {
    req?.resolve(ok);
    setReq(null);
  };

  const o = req?.opts;
  const ui = (
    <Sheet
      open={!!req}
      onClose={() => close(false)}
      size="sm"
      title={o?.title ?? ""}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" block onClick={() => close(false)}>
            {o?.cancelLabel ?? "Yo‘q"}
          </Button>
          <Button variant={o?.tone ?? "primary"} block onClick={() => close(true)} className={o?.tone === "danger" ? "bg-danger text-white hover:bg-danger/90" : undefined}>
            {o?.confirmLabel ?? "Ha"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center pb-1 pt-2 text-center">
        {o?.emoji && <div className="mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-slate-50 text-4xl">{o.emoji}</div>}
        {o?.text && <div className="max-w-sm text-[15px] leading-relaxed text-ink-2">{o.text}</div>}
      </div>
    </Sheet>
  );

  return [confirm, ui] as const;
}
