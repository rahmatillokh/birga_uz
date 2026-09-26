"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { REGIONS, getRegion } from "@/data/regions";
import { Button } from "@/components/ui/button";
import { Field, Input, OptionPills, Select, Switch } from "@/components/ui/form";
import { Logo, LogoMark } from "@/components/ui/logo";
import { CHILD_AVATARS, CONCERN_OPTIONS, INTEREST_OPTIONS } from "@/lib/constants";
import { useApp } from "@/lib/client/store";
import { tgUser } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { Child } from "@/lib/types";
import { ageOf, cn, todayKey } from "@/lib/utils";

const SLIDES = [
  {
    emoji: "🧠",
    title: "Bolangizni yaxshiroq tushuning",
    text: "5 daqiqalik savolnoma orqali 6 ta yo‘nalish bo‘yicha rivojlanish profili va individual reja oling.",
    color: "#e7f0fb",
  },
  {
    emoji: "🤖",
    title: "AI bilan uyda mashq qiling",
    text: "AI yordamchi, logoped va defektolog mashqlari, AI video nazorat va talaffuz tekshiruvi — hammasi bir joyda.",
    color: "#efeaff",
  },
  {
    emoji: "👨‍⚕️",
    title: "Mutaxassis doim yoningizda",
    text: "Barcha natijalar bitta rivojlanish pasportiga yig‘iladi. Uni mutaxassisga ko‘rsating yoki tumaningizdagi bepul sessiyaga yoziling.",
    color: "#e3f6ef",
  },
];

export default function OnboardingPage() {
  return (
    <Suspense>
      <Onboarding />
    </Suspense>
  );
}

function Onboarding() {
  const router = useRouter();
  const params = useSearchParams();
  const addMode = params.get("add") === "1";
  const status = useApp((s) => s.status);
  const init = useApp((s) => s.init);
  const view = useApp((s) => s.view);
  const act = useApp((s) => s.act);

  useEffect(() => {
    void init();
  }, [init]);

  const steps = useMemo(() => (addMode ? ["child", "concerns"] : ["welcome", "parent", "child", "concerns", "consent"]), [addMode]);
  const [step, setStep] = useState(0);
  const [slide, setSlide] = useState(0);
  const [saving, setSaving] = useState(false);

  // Ota-ona
  const [parentName, setParentName] = useState("");
  const [region, setRegion] = useState("toshkent-sh");
  const [district, setDistrict] = useState("");
  // Bola
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [gender, setGender] = useState<Child["gender"]>("o‘g‘il");
  const [avatar, setAvatar] = useState(CHILD_AVATARS[1]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  // Rozilik
  const [agree, setAgree] = useState(false);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [share, setShare] = useState(true);

  useEffect(() => {
    const u = tgUser();
    const fromView = view?.user.name && view.user.uid !== "demo" ? view.user.name : "";
    setParentName((p) => p || [u?.first_name, u?.last_name].filter(Boolean).join(" ") || fromView);
    if (view?.user.region) setRegion(view.user.region);
    if (view?.user.district) setDistrict(view.user.district);
  }, [view]);

  const districts = getRegion(region)?.districts ?? [];
  const age = birth ? ageOf(birth) : null;
  const current = steps[step];

  const canNext =
    current === "welcome" ||
    (current === "parent" && parentName.trim().length > 1 && !!district) ||
    (current === "child" && name.trim().length > 0 && !!birth && (age?.years ?? 0) < 12) ||
    current === "concerns" ||
    (current === "consent" && agree);

  async function finish() {
    setSaving(true);
    try {
      if (!addMode) {
        await act({ type: "user.update", patch: { name: parentName.trim(), region, district, onboarded: true } }, { silent: true });
        await act({ type: "user.consents", consents: { dataProcessing: true, videoAnalysis: video, audioAnalysis: audio, shareWithSpecialists: share } }, { silent: true });
      }
      const res = await act(
        {
          type: "child.create",
          child: { name: name.trim(), birthDate: birth, gender, avatar, concerns, interests, region: addMode ? undefined : region, district: addMode ? undefined : district },
        },
        { silent: true },
      );
      if (!res.ok) {
        toast.error(res.error ?? "Xatolik");
        return;
      }
      setStep(steps.length); // yakuniy ekran
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (!canNext) return;
    if (current === "welcome" && slide < SLIDES.length - 1) {
      setSlide(slide + 1);
      return;
    }
    if (step === steps.length - 1) void finish();
    else setStep(step + 1);
  }

  if (status !== "ready") {
    return (
      <div className="grid min-h-dvh place-items-center">
        <LogoMark size={64} className="animate-float" />
      </div>
    );
  }

  // Yakuniy ekran
  if (step >= steps.length) {
    return (
      <Frame>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="grid h-28 w-28 place-items-center rounded-[36px] bg-brand-50 text-6xl animate-pop">{avatar}</div>
          <h1 className="mt-6 text-3xl font-black text-ink">{name} profili tayyor! 🎉</h1>
          <p className="mt-2 max-w-sm text-[15px] text-muted">
            Endi 5 daqiqalik rivojlanish baholashidan o‘ting — YuniQo {name} uchun individual reja va mashqlarni tayyorlaydi.
          </p>
          <div className="mt-8 w-full max-w-sm space-y-3">
            <Button size="lg" block href="/assessment">
              🧠 Baholashni boshlash
            </Button>
            <Button size="lg" variant="secondary" block onClick={() => router.replace("/")}>
              Bosh sahifaga o‘tish
            </Button>
          </div>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      {/* Yuqori qism */}
      <div className="flex items-center justify-between">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="grid h-10 w-10 place-items-center rounded-2xl border border-line bg-white" aria-label="Orqaga">
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : addMode ? (
          <button onClick={() => router.back()} className="grid h-10 w-10 place-items-center rounded-2xl border border-line bg-white" aria-label="Orqaga">
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <Logo size={34} />
        )}
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <span key={s} className={cn("h-2 rounded-full transition-all", i === step ? "w-6 bg-brand-500" : i < step ? "w-2 bg-brand-300" : "w-2 bg-slate-200")} />
          ))}
        </div>
      </div>

      <div className="mt-6 flex-1">
        {current === "welcome" && (
          <div className="flex h-full flex-col">
            <div className="grid flex-1 place-items-center">
              <div className="text-center" key={slide}>
                <div className="mx-auto grid h-40 w-40 place-items-center rounded-[48px] text-[84px] animate-pop" style={{ background: SLIDES[slide].color }}>
                  {SLIDES[slide].emoji}
                </div>
                <h1 className="mt-8 text-[28px] font-black leading-tight text-ink">{SLIDES[slide].title}</h1>
                <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-muted">{SLIDES[slide].text}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} className={cn("h-2.5 rounded-full transition-all", i === slide ? "w-8 bg-brand-500" : "w-2.5 bg-slate-300")} aria-label={`Slayd ${i + 1}`} />
              ))}
            </div>
          </div>
        )}

        {current === "parent" && (
          <div className="space-y-5">
            <Heading emoji="👋" title="Tanishib olaylik" text="Ma’lumotlaringiz faqat sizga va siz ruxsat bergan mutaxassislarga ko‘rinadi." />
            <Field label="Ismingiz">
              <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Masalan: Gulnoza" autoFocus />
            </Field>
            <Field label="Viloyat">
              <Select
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setDistrict("");
                }}
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tuman / shahar" hint="Tumaningizdagi bepul YuniQo sessiyalarini ko‘rsatish uchun">
              <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">Tanlang…</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {current === "child" && (
          <div className="space-y-5">
            <Heading emoji="👶" title="Bola profili" text="Yoshiga mos savolnoma va mashqlarni tanlash uchun kerak." />
            <Field label="Bolaning ismi">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Amir" />
            </Field>
            <Field label="Tug‘ilgan sanasi" hint={age ? `Yoshi: ${age.label}` : "Kun.oy.yil"}>
              <Input type="date" value={birth} max={todayKey()} min="2012-01-01" onChange={(e) => setBirth(e.target.value)} />
            </Field>
            <Field label="Jinsi">
              <OptionPills
                value={gender}
                onChange={(v) => setGender(v as Child["gender"])}
                options={[
                  { value: "o‘g‘il", label: "👦 O‘g‘il bola" },
                  { value: "qiz", label: "👧 Qiz bola" },
                ]}
              />
            </Field>
            <Field label="Avatar">
              <div className="grid grid-cols-6 gap-2">
                {CHILD_AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={cn("grid aspect-square place-items-center rounded-2xl border text-3xl transition", a === avatar ? "border-brand-500 bg-brand-50 ring-4 ring-brand-100" : "border-line bg-white")}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {current === "concerns" && (
          <div className="space-y-6">
            <Heading emoji="💭" title="Nimalarga e’tibor beraylik?" text="Sizni tashvishlantirayotgan yo‘nalishlarni belgilang (ixtiyoriy). Bu tashxis emas — rejani to‘g‘ri tuzishga yordam beradi." />
            <OptionPills value={concerns} onChange={(v) => setConcerns(v as string[])} multiple options={CONCERN_OPTIONS.map((c) => ({ value: c, label: c }))} />
            <div>
              <div className="mb-2 text-sm font-bold text-ink-2">Qiziqishlari (mashqlarni qiziqarli qilish uchun)</div>
              <OptionPills value={interests} onChange={(v) => setInterests(v as string[])} multiple options={INTEREST_OPTIONS.map((c) => ({ value: c, label: c }))} />
            </div>
          </div>
        )}

        {current === "consent" && (
          <div className="space-y-4">
            <Heading emoji="🔐" title="Xavfsizlik va rozilik" text="Bola ma’lumotlari himoyalangan. Nimani kim bilan ulashishni faqat siz boshqarasiz." />
            <button
              onClick={() => setAgree(!agree)}
              className={cn("flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition", agree ? "border-brand-400 bg-brand-50" : "border-line bg-white")}
            >
              <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2", agree ? "border-brand-500 bg-brand-500 text-white" : "border-slate-300")}>
                {agree && <Check className="h-4 w-4" strokeWidth={3} />}
              </span>
              <span className="text-sm leading-relaxed text-ink-2">
                <b className="text-ink">Ota-ona (qonuniy vakil) sifatida</b> bolam haqidagi ma’lumotlarni YuniQo platformasida rivojlanishni kuzatish maqsadida qayta ishlashga roziman.
              </span>
            </button>
            <div className="divide-y divide-line rounded-2xl border border-line bg-white px-4">
              <Switch checked={video} onChange={setVideo} label="📹 Kamera orqali AI tahlil" description="Video faqat qurilmangizda tahlil qilinadi, hech qayerga yuborilmaydi" />
              <Switch checked={audio} onChange={setAudio} label="🎙️ Mikrofon orqali nutq tahlili" description="Talaffuz mashqlari uchun" />
              <Switch checked={share} onChange={setShare} label="👨‍⚕️ Mutaxassislarga ulashish" description="Faqat siz yozilgan yoki tanlagan mutaxassislarga, istalgan vaqtda bekor qilinadi" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <Button size="lg" block onClick={next} disabled={!canNext} loading={saving}>
          {current === "welcome" ? (slide < SLIDES.length - 1 ? "Keyingisi" : "Boshlash") : step === steps.length - 1 ? "Profilni yaratish" : "Davom etish"}
        </Button>
        {current === "welcome" && slide < SLIDES.length - 1 && (
          <button className="mt-3 w-full py-2 text-sm font-bold text-muted" onClick={() => setStep(1)}>
            O‘tkazib yuborish
          </button>
        )}
      </div>
    </Frame>
  );
}

function Heading({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div>
      <div className="text-4xl">{emoji}</div>
      <h1 className="mt-2 text-[26px] font-black leading-tight text-ink">{title}</h1>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{text}</p>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas bg-dots">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))] sm:py-10">
        <div className="flex flex-1 flex-col sm:rounded-[32px] sm:border sm:border-line sm:bg-white sm:p-8 sm:shadow-card">{children}</div>
      </div>
    </div>
  );
}
