"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/form";
import { InfoNote } from "@/components/ui/misc";
import { AI_CHECKS, DOMAINS } from "@/lib/constants";
import { CAMERA_ERRORS, type CameraErrorCode } from "@/lib/vision/camera";
import { CHECK_META } from "@/lib/vision/catalog";
import type { CameraCheckId } from "@/lib/vision/types";

export const PRIVACY_TEXT = "Video qurilmangizda tahlil qilinadi va hech qayerga yuborilmaydi";

/** To‘g‘ri holat qo‘llanmasi + kamerani yoqish */
export function IntroPanel({
  id,
  cameraIssue,
  consent,
  consentBusy,
  onConsent,
  onCamera,
  onDemo,
}: {
  id: CameraCheckId;
  cameraIssue: CameraErrorCode | null;
  consent: boolean;
  consentBusy: boolean;
  onConsent: () => void;
  onCamera: () => void;
  onDemo: () => void;
}) {
  const meta = CHECK_META[id];
  const d = DOMAINS[AI_CHECKS[id].domain];
  const issue = cameraIssue ? CAMERA_ERRORS[cameraIssue] : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
      <Card className="overflow-hidden">
        <div className="relative px-6 pb-6 pt-7 text-center" style={{ background: `linear-gradient(160deg, ${d.soft} 0%, #ffffff 90%)` }}>
          <div className="text-xs font-extrabold uppercase tracking-wider text-muted">To‘g‘ri holat</div>
          <div className="mx-auto mt-3 grid h-32 w-32 place-items-center rounded-[36px] bg-white text-[76px] leading-none shadow-card">
            <span className="animate-float">{meta.poseEmoji}</span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge tone="white" className="px-3 py-1 text-[13px]">
              {meta.view.emoji} {meta.view.label}
            </Badge>
            <Badge tone="white" className="px-3 py-1 text-[13px]">
              🎯 {meta.targetLabel}
            </Badge>
          </div>
        </div>
        <ol className="space-y-3 p-5">
          {meta.steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-brand-gradient text-lg font-black text-white shadow-brand">
                {i + 1}
              </span>
              <span className="pt-1.5 text-[16px] font-bold leading-snug text-ink">{s}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <CardTitle>📷 Kamerani joylashtiring</CardTitle>
          <p className="text-[15px] leading-relaxed text-ink-2">{meta.camera}</p>
          <div className="mt-4 text-xs font-extrabold uppercase tracking-wider text-muted">AI nimani tekshiradi</div>
          <ul className="mt-2 space-y-1.5">
            {meta.checks.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[15px] font-semibold text-ink-2">
                <span aria-hidden>✅</span>
                {c}
              </li>
            ))}
          </ul>
        </Card>

        <InfoNote emoji="🔒">
          <b className="text-ink">{PRIVACY_TEXT}.</b> Kamera faqat mashq vaqtida yonadi va tugashi bilan o‘chadi.
        </InfoNote>

        {!consent && (
          <Card className="p-4">
            <Switch
              checked={false}
              onChange={() => !consentBusy && onConsent()}
              label="Kamera orqali AI tahliliga roziman"
              description="Rozilikni istalgan vaqtda «Xavfsizlik» bo‘limida o‘zgartirishingiz mumkin"
            />
          </Card>
        )}

        {issue && (
          <div className="flex gap-3 rounded-2xl bg-warn/15 p-3.5 text-sm leading-relaxed text-ink-2 ring-1 ring-warn/30">
            <span className="text-lg leading-none">{issue.emoji}</span>
            <div>
              <b className="text-ink">{issue.title}.</b> {issue.text}
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Button size="lg" block onClick={onCamera} disabled={!consent || !!issue} loading={consentBusy}>
            📷 Kamerani yoqish
          </Button>
          <Button size="lg" variant="secondary" block onClick={onDemo}>
            ▶️ Demo rejim
          </Button>
        </div>
        <p className="-mt-1 text-center text-xs font-semibold text-muted">Demo rejim kamerasiz ishlaydi va AI qanday tahlil qilishini ko‘rsatadi</p>
      </div>
    </div>
  );
}

export interface Failure {
  emoji: string;
  title: string;
  text: string;
}

export function ErrorPanel({ failure, onRetry, onDemo, onBack }: { failure: Failure; onRetry: () => void; onDemo: () => void; onBack: () => void }) {
  return (
    <Card className="mx-auto max-w-xl p-6 text-center sm:p-8">
      <div className="text-6xl">{failure.emoji}</div>
      <h2 className="mt-3 text-xl font-black text-ink sm:text-2xl">{failure.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">{failure.text}</p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button size="lg" onClick={onRetry}>
          🔄 Qayta urinish
        </Button>
        <Button size="lg" variant="secondary" onClick={onDemo}>
          ▶️ Demo rejim
        </Button>
      </div>
      <button onClick={onBack} className="mt-4 text-sm font-bold text-brand-600 hover:text-brand-700">
        ← Mashq tavsifiga qaytish
      </button>
    </Card>
  );
}
