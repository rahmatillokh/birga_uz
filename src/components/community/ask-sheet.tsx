"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, OptionPills, Select, Textarea } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { useView } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { haptic } from "@/lib/client/telegram";
import { toast } from "@/lib/client/toast";
import type { ActResult } from "@/lib/types";
import { cn } from "@/lib/utils";
import { allGroups, TAG_SUGGESTIONS, type PostKind } from "./data";

type AskKind = Exclude<PostKind, "efir">;

const COPY: Record<AskKind, { sheet: string; title: string; text: string }> = {
  savol: {
    sheet: "❓ Savol berish",
    title: "Masalan: 4 yoshli o‘g‘lim hali gap tuzmaydi — nima qilsam bo‘ladi?",
    text: "Batafsil yozing: bolaning yoshi, nimalarni kuzatyapsiz, nimalarni sinab ko‘rdingiz…",
  },
  tajriba: {
    sheet: "💬 Tajriba ulashish",
    title: "Masalan: «R» tovushini uyda qanday chiqardik",
    text: "Nima yordam berdi, qancha vaqt ketdi, boshqa ota-onalarga nimani tavsiya qilasiz…",
  },
  maslahat: {
    sheet: "💡 Maslahat ulashish",
    title: "Masalan: Uyda motorika uchun 5 ta oddiy o‘yin",
    text: "Maslahatingizni qadam-baqadam yozing…",
  },
};

const MAX_TAGS = 3;

/** "Savol berish" formasi (pastdan chiqadigan oyna) */
export function AskSheet({
  onClose,
  defaultGroupId,
  defaultKind = "savol",
  onPosted,
}: {
  onClose: () => void;
  defaultGroupId?: string;
  defaultKind?: AskKind;
  onPosted?: (postId: string | undefined, kind: AskKind) => void;
}) {
  const { user } = useView();
  const act = useApp((s) => s.act);
  const groups = allGroups();
  const regional = groups.filter((g) => g.type === "hudud");
  const topical = groups.filter((g) => g.type !== "hudud");

  const [groupId, setGroupId] = useState(() =>
    defaultGroupId && groups.some((g) => g.id === defaultGroupId) ? defaultGroupId : (topical[0] ?? groups[0]).id,
  );
  const [kind, setKind] = useState<AskKind>(defaultKind);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  const errors = {
    title: title.trim().length < 5 ? "Sarlavha kamida 5 ta belgidan iborat bo‘lsin" : "",
    text: text.trim().length < 15 ? "Batafsilroq yozing (kamida 15 ta belgi)" : "",
  };
  const shownAs = user.consents.community ? user.name || "Ota-ona" : "Anonim ota-ona";

  const toggleTag = (t: string) => {
    haptic("select");
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : cur.length >= MAX_TAGS ? cur : [...cur, t]));
  };

  const submit = async () => {
    setTried(true);
    if (errors.title || errors.text) {
      toast.error(errors.title || errors.text);
      return;
    }
    setBusy(true);
    let res: ActResult;
    try {
      res = await act({ type: "post.create", groupId, title: title.trim(), text: text.trim(), kind, tags }, { silent: true });
    } catch {
      res = { ok: false, error: "Internet aloqasini tekshirib, qayta urinib ko‘ring" };
    }
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "Joylab bo‘lmadi");
      return;
    }
    haptic("success");
    toast.success(
      kind === "savol" ? "Savolingiz joylandi. Mutaxassislar tez orada javob beradi" : "Postingiz joylandi. Tajribangiz boshqalarga yordam beradi!",
      "📨",
    );
    onPosted?.(res.createdId, kind);
    onClose();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={COPY[kind].sheet}
      footer={
        <Button block size="lg" loading={busy} onClick={submit}>
          {!busy && <Send className="h-4 w-4" />}
          Joylash
        </Button>
      }
    >
      <div className="space-y-4 pt-1">
        <Field label="Post turi">
          <OptionPills
            value={kind}
            onChange={(v) => setKind(v as AskKind)}
            options={[
              { value: "savol", label: "❓ Savol" },
              { value: "tajriba", label: "💬 Tajriba" },
              { value: "maslahat", label: "💡 Maslahat" },
            ]}
          />
        </Field>

        <Field label="Guruh">
          <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            {topical.length > 0 && (
              <optgroup label="Mavzuli guruhlar">
                {topical.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.name}
                  </option>
                ))}
              </optgroup>
            )}
            {regional.length > 0 && (
              <optgroup label="Hududiy guruhlar">
                {regional.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.name}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>

        <Field label="Sarlavha">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder={COPY[kind].title} />
          {tried && errors.title && <p className="text-xs font-bold text-danger">⚠️ {errors.title}</p>}
        </Field>

        <Field label="Matn" hint={`${text.length}/2000`}>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={2000} placeholder={COPY[kind].text} />
          {tried && errors.text && <p className="text-xs font-bold text-danger">⚠️ {errors.text}</p>}
        </Field>

        <Field label={`Teglar (${MAX_TAGS} tagacha)`}>
          <div className="flex flex-wrap gap-2">
            {TAG_SUGGESTIONS.map((t) => {
              const on = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(t)}
                  disabled={!on && tags.length >= MAX_TAGS}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[13px] font-bold transition disabled:opacity-40",
                    on ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-white text-ink-2 hover:border-brand-200",
                  )}
                >
                  #{t}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="flex gap-3 rounded-2xl bg-[#fff8e6] p-3.5 text-[13px] leading-relaxed text-ink-2 ring-1 ring-[#fde3a7]">
          <span className="text-lg leading-none">🔒</span>
          <div>
            <span className="font-extrabold text-ink">Maxfiylikni saqlang:</span> farzandingizning suratlari, to‘liq ism-familiyasi, tibbiy hujjatlari,
            manzil va telefon raqamlarini joylamang. Post <span className="font-bold text-ink">«{shownAs}»</span> nomidan chiqadi —{" "}
            <Link href="/settings" className="font-bold text-brand-700 underline decoration-brand-300 underline-offset-2">
              sozlamalarda
            </Link>{" "}
            o‘zgartirish mumkin. Barcha postlar moderatsiyadan o‘tadi.
          </div>
        </div>
      </div>
    </Sheet>
  );
}
