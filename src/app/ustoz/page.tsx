"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AiInsight } from "@/components/home/daily-tip";
import { AiChat } from "@/components/ustoz/chat";
import { KidLesson } from "@/components/ustoz/lesson";
import { Badge } from "@/components/ui/badge";
import { LockedOverlay, PageHeader } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { Tabs } from "@/components/ui/tabs";
import { useActiveChild, useIsPremium } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";

type Tab = "ota-ona" | "dars" | "suhbat";

export default function UstozPage() {
  return (
    <Suspense>
      <Ustoz />
    </Suspense>
  );
}

function Ustoz() {
  const params = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "ota-ona");
  const child = useActiveChild();
  const premium = useIsPremium();
  const aiEnabled = useApp((s) => s.aiEnabled);
  const [limitOpen, setLimitOpen] = useState(false);
  const name = child?.name ?? "farzandingiz";

  return (
    <div className="animate-fade-up">
      <PageHeader
        emoji="👩‍🏫"
        title="Ustoz AI"
        subtitle="Bola bilan interaktiv mashg‘ulot, savol-javob va ota-onaga kunlik tavsiyalar"
        actions={<Badge tone={aiEnabled ? "premium" : "gray"}>{aiEnabled ? "✨ Claude AI" : "Demo AI"}</Badge>}
      />
      <Tabs
        value={tab}
        onChange={(t) => {
          setTab(t);
          router.replace(`/ustoz?tab=${t}`, { scroll: false });
        }}
        items={[
          { value: "ota-ona", label: "👩 Ota-onaga maslahat" },
          { value: "dars", label: "🧒 Bola bilan dars" },
          { value: "suhbat", label: "💬 Bola bilan suhbat" },
        ]}
        className="mb-5"
      />

      {tab === "ota-ona" && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AiChat
              mode="parent"
              storageKey={`yq-chat-parent-${child?.id ?? "x"}`}
              childId={child?.id}
              childName={child?.name}
              greeting={`Assalomu alaykum! Men **Ustoz AI** — ${name}ning rivojlanishi bo‘yicha yordamchingizman. 💙\n\nMen ${name}ning baholash natijalari, individual rejasi va mutaxassis tavsiyalarini bilaman. Nutq, diqqat, motorika, xulq yoki kundalik tartib haqida so‘rang.`}
              suggestions={[
                `${name} R harfini ayta olmayapti, nima qilay?`,
                "Diqqatni jamlash uchun qanday o‘yinlar bor?",
                "Yassi oyoqlikni uyda qanday mashqlar bilan tuzatamiz?",
                "Bugungi 20 daqiqalik mashg‘ulot rejasini tuzib ber",
                `${name}ning natijalari qanday o‘zgardi?`,
              ]}
              limit={premium ? undefined : 3}
              onLimit={() => setLimitOpen(true)}
              initialInput={params.get("q") ?? undefined}
            />
          </div>
          <div className="space-y-4">
            <AiInsight childId={child?.id} kind="progress" title="AI progress tahlili" />
            <div className="rounded-3xl border border-line bg-white p-4 text-sm text-ink-2 shadow-card">
              <div className="mb-2 font-extrabold text-ink">🛡️ Ustoz AI qoidalari</div>
              <ul className="space-y-1.5">
                <li>• Tashxis qo‘ymaydi va dori tavsiya qilmaydi</li>
                <li>• Xavotirli belgilarda mutaxassisga yo‘naltiradi</li>
                <li>• Faqat siz ruxsat bergan ma’lumotlardan foydalanadi</li>
                <li>• {premium ? "Premium: cheksiz savollar" : "Bepul tarif: kuniga 3 ta savol"}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === "dars" && <KidLesson />}

      {tab === "suhbat" &&
        (premium ? (
          <div className="mx-auto max-w-2xl">
            <AiChat
              mode="kid"
              big
              storageKey={`yq-chat-kid-${child?.id ?? "x"}`}
              childId={child?.id}
              childName={child?.name}
              greeting={`Salom, **${name}**! 👋 Men Ustoz AI. Keling, birga o‘ynaymiz va o‘rganamiz! Nima haqida gaplashamiz? 😊`}
              suggestions={["🐱 Hayvonlar haqida gapir", "🌈 Ranglarni o‘rgat", "🔢 Sanashni o‘ynaymiz", "🦁 Menga topishmoq ayt"]}
              placeholder="Bola bilan birga yozing yoki mikrofonni bosing…"
            />
          </div>
        ) : (
          <LockedOverlay title="Bola bilan AI suhbat — Premium" text="Ustoz AI bola bilan uning yoshiga mos tilda suhbatlashadi, savol beradi va o‘rgatadi." />
        ))}

      <Sheet open={limitOpen} onClose={() => setLimitOpen(false)} title="Bugungi bepul savollar tugadi" size="sm">
        <LockedOverlay title="Cheksiz Ustoz AI" text="Premium tarifda Ustoz AI’ga cheksiz savol bering, AI video nazorat va batafsil hisobotlardan foydalaning." />
      </Sheet>
    </div>
  );
}
