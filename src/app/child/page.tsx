"use client";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { REGIONS, districtLabel, getRegion, regionName } from "@/data/regions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, Input, OptionPills, Select, Textarea } from "@/components/ui/form";
import { PageHeader, Section, StatTile } from "@/components/ui/misc";
import { Sheet } from "@/components/ui/sheet";
import { CHILD_AVATARS, CONCERN_OPTIONS, DOMAINS, DOMAIN_ORDER, INTEREST_OPTIONS } from "@/lib/constants";
import { useChildData } from "@/lib/client/hooks";
import { useApp } from "@/lib/client/store";
import { toast } from "@/lib/client/toast";
import type { Child, Domain, HistoryEvent } from "@/lib/types";
import { ageOf, cn, formatDate, timeAgo, todayKey, uid } from "@/lib/utils";

const MOODS = ["😊", "🤩", "😐", "😢", "😠", "💪", "😴"];
const HISTORY_ICON: Record<HistoryEvent["type"], string> = {
  milestone: "🌱",
  medical: "🩺",
  assessment: "🧠",
  specialist: "👩‍⚕️",
  achievement: "🏆",
};

export default function ChildProfilePage() {
  const { child, latest, points, level, activities, assessments } = useChildData();
  const act = useApp((s) => s.act);
  const [edit, setEdit] = useState(false);
  const [obs, setObs] = useState("");
  const [mood, setMood] = useState("😊");
  const [goalText, setGoalText] = useState("");
  const [goalDomain, setGoalDomain] = useState<Domain>("nutq");
  const [histOpen, setHistOpen] = useState(false);
  const [listEdit, setListEdit] = useState<null | "strengths" | "needs" | "diagnoses">(null);

  if (!child) return null;
  const age = ageOf(child.birthDate);
  const update = (patch: Partial<Child>) => act({ type: "child.update", childId: child.id, patch }, { silent: true });

  return (
    <div className="animate-fade-up">
      <PageHeader emoji="👶" title="Bola profili" subtitle="Rivojlanish tarixi, qiziqishlar, kuchli tomonlar, kuzatuvlar va shaxsiy maqsadlar" />

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-5 bg-gradient-to-br from-brand-50 via-white to-[#fff7e6] p-5 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[30px] bg-white text-6xl shadow-card">{child.avatar}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-ink">{child.name}</h2>
              <button onClick={() => setEdit(true)} className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-ink-2 hover:bg-brand-50" aria-label="Tahrirlash">
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1 text-[15px] font-semibold text-ink-2">
              {age.label} · {child.gender === "qiz" ? "qiz bola" : "o‘g‘il bola"} · tug‘ilgan: {formatDate(child.birthDate, { year: true })}
            </div>
            {child.region && (
              <div className="mt-0.5 text-sm text-muted">
                📍 {regionName(child.region)}
                {child.district ? `, ${districtLabel(child.district)}` : ""}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {child.concerns.map((c) => (
                <Badge key={c} tone="warn">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {[
            ["🧠", "Umumiy rivojlanish", latest ? `${latest.overall}%` : "—"],
            ["⭐", "Ball", `${points}`],
            ["🎯", "Mashg‘ulotlar", `${activities.length}`],
            [level.emoji, "Daraja", level.title],
          ].map(([e, l, v]) => (
            <div key={l} className="bg-white px-4 py-3">
              <div className="text-xs font-bold text-muted">
                {e} {l}
              </div>
              <div className="text-lg font-black text-ink">{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle>🎨 Qiziqishlari</CardTitle>
          <OptionPills
            multiple
            value={child.interests}
            onChange={(v) => update({ interests: v as string[] })}
            options={Array.from(new Set([...INTEREST_OPTIONS, ...child.interests])).map((i) => ({ value: i, label: i }))}
          />
          <p className="mt-3 text-xs font-semibold text-muted">AI mashqlar va Ustoz AI qiziqishlarga moslashadi (masalan, mashinalar orqali sanash).</p>
        </Card>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <ListCard title="💪 Kuchli tomonlari" items={child.strengths} tone="good" onEdit={() => setListEdit("strengths")} />
          <ListCard title="🌱 Rivojlantirish kerak" items={child.needs} tone="warn" onEdit={() => setListEdit("needs")} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Section title="🎯 Shaxsiy maqsadlar" className="mt-0">
          <Card className="p-4">
            <div className="space-y-1.5">
              {child.goals.map((g) => (
                <div key={g.id} className="group flex items-center gap-3 rounded-2xl p-2 hover:bg-slate-50">
                  <button
                    onClick={() => act({ type: "child.goal.toggle", childId: child.id, goalId: g.id }, { silent: true })}
                    className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2", g.done ? "border-good bg-good text-white" : "border-slate-300")}
                    aria-label="Belgilash"
                  >
                    {g.done && <Check className="h-4 w-4" strokeWidth={3} />}
                  </button>
                  <span className={cn("flex-1 text-sm font-bold", g.done ? "text-muted line-through" : "text-ink")}>{g.text}</span>
                  <span title={DOMAINS[g.domain].label}>{DOMAINS[g.domain].emoji}</span>
                  <button onClick={() => act({ type: "child.goal.remove", childId: child.id, goalId: g.id }, { silent: true })} className="text-faint opacity-0 group-hover:opacity-100" aria-label="O‘chirish">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input value={goalText} onChange={(e) => setGoalText(e.target.value)} placeholder="Yangi maqsad, masalan: 10 gacha sanash" className="h-11 flex-1 text-sm" />
              <Select value={goalDomain} onChange={(e) => setGoalDomain(e.target.value as Domain)} className="h-11 text-sm sm:w-44">
                {DOMAIN_ORDER.map((d) => (
                  <option key={d} value={d}>
                    {DOMAINS[d].emoji} {DOMAINS[d].label}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                className="h-11"
                disabled={!goalText.trim()}
                onClick={async () => {
                  await act({ type: "child.goal.add", childId: child.id, text: goalText, domain: goalDomain }, { silent: true });
                  setGoalText("");
                  toast.success("Maqsad qo‘shildi", "🎯");
                }}
              >
                <Plus className="h-4 w-4" /> Qo‘shish
              </Button>
            </div>
          </Card>
        </Section>

        <Section title="📝 Ota-ona kuzatuvlari" className="mt-0">
          <Card className="p-4">
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Bugun nimani payqadingiz? Masalan: «Mashinani R bilan aytdi»" rows={2} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex gap-1">
                {MOODS.map((m) => (
                  <button key={m} onClick={() => setMood(m)} className={cn("grid h-9 w-9 place-items-center rounded-xl text-xl", mood === m ? "bg-brand-100 ring-2 ring-brand-300" : "hover:bg-slate-100")}>
                    {m}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                disabled={!obs.trim()}
                onClick={async () => {
                  await act({ type: "child.observation", childId: child.id, text: obs, mood }, { silent: true });
                  setObs("");
                  toast.success("Kuzatuv saqlandi — mutaxassis ham ko‘ra oladi", "📝");
                }}
              >
                Saqlash
              </Button>
            </div>
            <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
              {child.observations.map((o) => (
                <div key={o.id} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="text-2xl">{o.mood ?? "📝"}</span>
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed text-ink-2">{o.text}</p>
                    <div className="mt-0.5 text-xs font-semibold text-faint">{timeAgo(o.at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>
      </div>

      <Section
        title="📜 Rivojlanish tarixi"
        action={
          <Button size="sm" variant="soft" onClick={() => setHistOpen(true)}>
            <Plus className="h-4 w-4" /> Voqea qo‘shish
          </Button>
        }
      >
        <Card className="p-5">
          <ol className="relative space-y-4 border-l-2 border-brand-100 pl-6">
            {[...child.history]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[37px] grid h-8 w-8 place-items-center rounded-full bg-white text-base shadow-card ring-2 ring-brand-100">{HISTORY_ICON[h.type]}</span>
                  <div className="text-xs font-extrabold text-muted">{formatDate(h.date, { year: true })}</div>
                  <div className="font-extrabold text-ink">{h.title}</div>
                  {h.description && <p className="text-sm text-ink-2">{h.description}</p>}
                </li>
              ))}
          </ol>
        </Card>
      </Section>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Baholashlar" value={assessments.length} emoji="🧠" color="#fdeee7" />
        <StatTile label="Tashxis/xulosalar" value={child.diagnoses.length} emoji="🩺" color="#e0f2fe" hint={<button className="font-bold text-brand-600" onClick={() => setListEdit("diagnoses")}>Ko‘rish / tahrirlash</button>} />
        <StatTile label="Kuzatuvlar" value={child.observations.length} emoji="📝" color="#e3f6ef" />
        <StatTile label="Maqsadlar" value={`${child.goals.filter((g) => g.done).length}/${child.goals.length}`} emoji="🎯" color="#fdf3dc" />
      </div>

      <EditChild open={edit} onClose={() => setEdit(false)} child={child} onSave={async (patch) => { await update(patch); toast.success("Profil yangilandi"); setEdit(false); }} />
      <AddHistory
        open={histOpen}
        onClose={() => setHistOpen(false)}
        onSave={async (h) => {
          await update({ history: [...child.history, h] });
          setHistOpen(false);
          toast.success("Tarixga qo‘shildi", "📜");
        }}
      />
      {listEdit && (
        <EditList
          title={listEdit === "strengths" ? "Kuchli tomonlari" : listEdit === "needs" ? "Rivojlantirish kerak bo‘lgan tomonlari" : "Tashxis va mutaxassis xulosalari (ota-ona kiritadi)"}
          items={child[listEdit]}
          onClose={() => setListEdit(null)}
          onSave={async (items) => {
            await update({ [listEdit]: items } as Partial<Child>);
            setListEdit(null);
          }}
        />
      )}
    </div>
  );
}

function ListCard({ title, items, tone, onEdit }: { title: string; items: string[]; tone: "good" | "warn"; onEdit: () => void }) {
  return (
    <Card className="p-5">
      <CardTitle action={<button onClick={onEdit} className="text-sm font-bold text-brand-600">Tahrirlash</button>}>{title}</CardTitle>
      <ul className="space-y-1.5">
        {items.map((s) => (
          <li key={s} className="flex gap-2 text-sm font-semibold text-ink-2">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", tone === "good" ? "bg-good" : "bg-warn")} />
            {s}
          </li>
        ))}
        {!items.length && <li className="text-sm text-muted">Hali kiritilmagan</li>}
      </ul>
    </Card>
  );
}

function EditList({ title, items, onClose, onSave }: { title: string; items: string[]; onClose: () => void; onSave: (items: string[]) => void }) {
  const [list, setList] = useState(items);
  const [text, setText] = useState("");
  return (
    <Sheet open onClose={onClose} title={title} footer={<Button block onClick={() => onSave(list)}>Saqlash</Button>}>
      <div className="space-y-2">
        {list.map((s, i) => (
          <div key={i} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
            <span className="flex-1 text-sm font-semibold text-ink-2">{s}</span>
            <button onClick={() => setList(list.filter((_, k) => k !== i))} className="text-faint hover:text-danger" aria-label="O‘chirish">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Yangi band…" className="h-11" />
          <Button
            size="sm"
            className="h-11"
            disabled={!text.trim()}
            onClick={() => {
              setList([...list, text.trim()]);
              setText("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function EditChild({ open, onClose, child, onSave }: { open: boolean; onClose: () => void; child: Child; onSave: (p: Partial<Child>) => void }) {
  const [name, setName] = useState(child.name);
  const [birth, setBirth] = useState(child.birthDate);
  const [avatar, setAvatar] = useState(child.avatar);
  const [gender, setGender] = useState(child.gender);
  const [region, setRegion] = useState(child.region ?? "toshkent-sh");
  const [district, setDistrict] = useState(child.district ?? "");
  const [concerns, setConcerns] = useState(child.concerns);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Profilni tahrirlash"
      footer={
        <Button block onClick={() => onSave({ name, birthDate: birth, avatar, gender, region, district, concerns })} disabled={!name.trim() || !birth}>
          Saqlash
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="Ism">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Tug‘ilgan sana">
          <Input type="date" value={birth} max={todayKey()} onChange={(e) => setBirth(e.target.value)} />
        </Field>
        <Field label="Jinsi">
          <OptionPills value={gender} onChange={(v) => setGender(v as Child["gender"])} options={[{ value: "o‘g‘il", label: "👦 O‘g‘il" }, { value: "qiz", label: "👧 Qiz" }]} />
        </Field>
        <Field label="Avatar">
          <div className="grid grid-cols-6 gap-2">
            {CHILD_AVATARS.map((a) => (
              <button key={a} onClick={() => setAvatar(a)} className={cn("grid aspect-square place-items-center rounded-2xl border text-2xl", a === avatar ? "border-brand-500 bg-brand-50" : "border-line")}>
                {a}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Viloyat">
            <Select value={region} onChange={(e) => { setRegion(e.target.value); setDistrict(""); }}>
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Tuman">
            <Select value={district} onChange={(e) => setDistrict(e.target.value)}>
              <option value="">Tanlang…</option>
              {(getRegion(region)?.districts ?? []).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Tashvishlar">
          <OptionPills multiple value={concerns} onChange={(v) => setConcerns(v as string[])} options={CONCERN_OPTIONS.map((c) => ({ value: c, label: c }))} />
        </Field>
      </div>
    </Sheet>
  );
}

function AddHistory({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (h: HistoryEvent) => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayKey());
  const [type, setType] = useState<HistoryEvent["type"]>("milestone");
  const [desc, setDesc] = useState("");
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Rivojlanish tarixiga voqea qo‘shish"
      footer={<Button block disabled={!title.trim()} onClick={() => onSave({ id: uid("h"), title: title.trim(), date, type, description: desc.trim() || undefined })}>Qo‘shish</Button>}
    >
      <div className="space-y-4">
        <Field label="Voqea turi">
          <OptionPills
            value={type}
            onChange={(v) => setType(v as HistoryEvent["type"])}
            options={[
              { value: "milestone", label: "🌱 Rivojlanish bosqichi" },
              { value: "medical", label: "🩺 Tibbiy ko‘rik" },
              { value: "specialist", label: "👩‍⚕️ Mutaxassis" },
              { value: "achievement", label: "🏆 Yutuq" },
            ]}
          />
        </Field>
        <Field label="Nomi">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Birinchi marta velosiped haydadi" />
        </Field>
        <Field label="Sana">
          <Input type="date" value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Izoh (ixtiyoriy)">
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  );
}
