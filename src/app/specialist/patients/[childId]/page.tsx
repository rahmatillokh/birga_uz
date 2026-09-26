"use client";

import { Printer, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EXERCISES, getExercise } from "@/data/exercises";
import { getSpecialist } from "@/data/specialists";
import { ReportView } from "@/components/report/report-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Field, Input, OptionPills, Select, Switch, Textarea } from "@/components/ui/form";
import { Avatar, EmptyState, InfoNote, PageHeader, Skeleton } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { SECTIONS, SPECIALTIES } from "@/lib/constants";
import { FREQUENCY_LABEL } from "@/lib/core/plan";
import { apiPost } from "@/lib/client/api";
import { useApp } from "@/lib/client/store";
import { toast } from "@/lib/client/toast";
import type { PlanItem, Section, SpecialistNote } from "@/lib/types";
import { addDays, ageOf, cn, daysBetween, formatDate, formatDateTime, todayKey } from "@/lib/utils";

type Tab = "hisobot" | "topshiriq" | "xulosa" | "hamkasblar";

const SPECIALTY_SECTION: Partial<Record<string, Section>> = {
  logoped: "logoped",
  nutq_terapevti: "logoped",
  defektolog: "defektolog",
  maxsus_pedagog: "defektolog",
  psixolog: "defektolog",
  fizioterapevt: "motorika",
  reabilitolog: "motorika",
};

export default function PatientPage() {
  const { childId } = useParams<{ childId: string }>();
  const spView = useApp((s) => s.spView);
  const specialistId = useApp((s) => s.specialistId);
  const loadSpecialist = useApp((s) => s.loadSpecialist);
  const setRole = useApp((s) => s.setRole);
  const spAct = useApp((s) => s.spAct);
  const mode = useApp((s) => s.mode);
  const [tab, setTab] = useState<Tab>("hisobot");

  useEffect(() => {
    setRole("specialist");
    if (!spView) void loadSpecialist();
  }, [spView, loadSpecialist, setRole]);

  const sp = getSpecialist(specialistId);
  const p = spView?.patients.find((x) => x.child.id === childId);

  // Topshiriq formasi
  const defaultSection = (sp && SPECIALTY_SECTION[sp.specialty]) ?? "logoped";
  const [section, setSection] = useState<Section>(defaultSection);
  const [exId, setExId] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [freq, setFreq] = useState<PlanItem["frequency"]>("har_kuni");
  const [due, setDue] = useState(addDays(todayKey(), 14));
  // Xulosa formasi
  const [kind, setKind] = useState<SpecialistNote["kind"]>("tavsiya");
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(true);
  const [drafting, setDrafting] = useState(false);
  // Hamkasb izohi
  const [colText, setColText] = useState("");

  useEffect(() => setSection(defaultSection), [defaultSection]);

  const exOptions = useMemo(() => {
    const age = p ? ageOf(p.child.birthDate).years : 5;
    return EXERCISES.filter((e) => e.section === section && age >= e.ageMin - 1 && age <= e.ageMax + 1);
  }, [section, p]);

  if (!spView) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (!p || !sp) return <EmptyState emoji="🔒" title="Bola ma’lumotlariga ruxsat yo‘q" text="Ota-ona pasportni ulashgandan so‘ng ko‘rinadi." action={<Button href="/specialist">Kabinetga qaytish</Button>} />;

  const myAssignments = p.assignments.filter((a) => a.specialistId === specialistId);
  const colleagues = p.notes.filter((n) => n.kind === "hamkasb");
  const team = Array.from(new Set([...p.notes.map((n) => n.specialistId), ...p.assignments.map((a) => a.specialistId)])).map((id) => getSpecialist(id)).filter(Boolean);

  async function assign() {
    if (!p) return;
    const ex = getExercise(exId);
    const r = await spAct({
      type: "sp.assign",
      childId: p.child.id,
      exerciseId: ex?.id,
      title: title.trim() || ex?.title || "Individual topshiriq",
      note: note.trim(),
      frequency: freq,
      dueDate: due,
    });
    if (r.ok) {
      toast.success("Topshiriq berildi — ota-onaning rejasiga qo‘shildi va Telegram orqali xabar yuborildi", "📋");
      setExId("");
      setTitle("");
      setNote("");
    } else toast.error(r.error ?? "Xatolik");
  }

  async function saveNote(k: SpecialistNote["kind"], t: string, vis: boolean) {
    if (!p || !t.trim()) return;
    const r = await spAct({ type: "sp.note", childId: p.child.id, kind: k, text: t, visibleToParent: vis });
    if (r.ok) toast.success(k === "hamkasb" ? "Hamkasblarga yuborildi" : "Ota-onaga yuborildi va pasportga qo‘shildi", "💬");
    else toast.error(r.error ?? "Xatolik");
  }

  async function draft() {
    if (!p) return;
    setDrafting(true);
    try {
      if (mode === "offline") throw new Error("offline");
      const { data } = await apiPost<{ text: string; ai: boolean }>("/api/ai/insight", { childId: p.child.id, kind: "report", specialistId });
      setText(data.text);
      setKind("xulosa");
      toast.success(data.ai ? "Claude AI xulosa qoralamasini tayyorladi" : "Xulosa qoralamasi tayyor", "🤖");
    } catch {
      toast.error("Qoralamani tayyorlab bo‘lmadi");
    } finally {
      setDrafting(false);
    }
  }

  const completionsFor = (asgId: string, exerciseId?: string, from?: string) =>
    p.activities.filter((a) => a.kind === "exercise" && (a.assignmentId === asgId || (exerciseId && a.refId === exerciseId && (!from || a.at >= from)))).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        back="/specialist"
        title={`${p.child.avatar} ${p.child.name}`}
        subtitle={`${ageOf(p.child.birthDate).label} · ota-ona: ${p.parentName}${p.share ? ` · ruxsat ${formatDate(p.share.expiresAt)} gacha` : ""}`}
        actions={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> <span className="hidden sm:inline">Hisobot</span> PDF
          </Button>
        }
      />

      {team.length > 0 && (
        <div className="no-print mb-4 flex flex-wrap items-center gap-2 rounded-3xl border border-line bg-white p-3 shadow-card">
          <span className="px-1 text-xs font-extrabold uppercase tracking-wide text-muted">Bola jamoasi:</span>
          {team.map((t) => (
            <span key={t!.id} className="flex items-center gap-1.5 rounded-full bg-slate-50 py-1 pl-1 pr-3 text-xs font-bold text-ink-2">
              <Avatar name={t!.name} color={t!.color} size={24} />
              {t!.name.split(" ")[0]} · {SPECIALTIES[t!.specialty].label}
            </span>
          ))}
        </div>
      )}

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "hisobot", label: "📁 Hisobot" },
          { value: "topshiriq", label: "📋 Topshiriqlar", count: myAssignments.filter((a) => a.status === "faol").length },
          { value: "xulosa", label: "💬 Tavsiya / xulosa" },
          { value: "hamkasblar", label: "🤝 Hamkasblar", count: colleagues.length },
        ]}
        className="no-print mb-5"
      />

      {tab === "hisobot" && <ReportView data={p} audience="specialist" />}

      {tab === "topshiriq" && (
        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-2">
            <CardTitle>➕ Individual topshiriq berish</CardTitle>
            <div className="space-y-4">
              <Field label="Bo‘lim">
                <OptionPills
                  value={section}
                  onChange={(v) => {
                    setSection(v as Section);
                    setExId("");
                  }}
                  options={(Object.keys(SECTIONS) as Section[]).map((s) => ({ value: s, label: `${SECTIONS[s].emoji} ${SECTIONS[s].label.split(" ")[0]}` }))}
                />
              </Field>
              <Field label="Mashq (kutubxonadan)">
                <Select
                  value={exId}
                  onChange={(e) => {
                    setExId(e.target.value);
                    const ex = getExercise(e.target.value);
                    if (ex && !title) setTitle(ex.title);
                  }}
                >
                  <option value="">— Mashqsiz (erkin topshiriq) —</option>
                  {exOptions.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.emoji} {e.title} · {e.topic}
                      {e.aiCheck ? " · 🤖 AI" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Topshiriq nomi">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: R tovushini so‘zlarda avtomatlashtirish" />
              </Field>
              <Field label="Ota-onaga ko‘rsatma">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Qanday bajarish, nimaga e’tibor berish, necha marta…" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Takrorlash">
                  <Select value={freq} onChange={(e) => setFreq(e.target.value as PlanItem["frequency"])}>
                    {(Object.keys(FREQUENCY_LABEL) as PlanItem["frequency"][]).map((f) => (
                      <option key={f} value={f}>
                        {FREQUENCY_LABEL[f]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Muddat">
                  <Input type="date" value={due} min={todayKey()} onChange={(e) => setDue(e.target.value)} />
                </Field>
              </div>
              <Button block onClick={assign} disabled={!exId && !title.trim()}>
                📋 Topshiriq berish
              </Button>
              <InfoNote emoji="🔔">Topshiriq bolaning individual rejasiga qo‘shiladi, ota-ona Telegram bot orqali bildirishnoma oladi, bajarilishi avtomatik kuzatiladi.</InfoNote>
            </div>
          </Card>

          <div className="space-y-3 lg:col-span-3">
            <div className="text-lg font-black text-ink">Mening topshiriqlarim va bajarilishi</div>
            {myAssignments.length === 0 && <EmptyState emoji="📋" title="Topshiriqlar yo‘q" text="Chapdagi forma orqali birinchi topshiriqni bering." />}
            {[...myAssignments]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((a) => {
                const ex = getExercise(a.exerciseId);
                const daysSince = Math.max(1, daysBetween(a.createdAt.slice(0, 10), todayKey()) + 1);
                const expected = a.frequency === "har_kuni" ? daysSince : a.frequency === "haftada_3" ? Math.ceil((daysSince / 7) * 3) : Math.ceil((daysSince / 7) * 2);
                const doneN = completionsFor(a.id, a.exerciseId, a.createdAt);
                return (
                  <Card key={a.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-2xl">{ex?.emoji ?? "📋"}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-ink">{a.title}</span>
                          <Badge tone={a.status === "faol" ? "brand" : "good"}>{a.status === "faol" ? "Faol" : "✅ Bajarildi"}</Badge>
                        </div>
                        <div className="text-xs font-semibold text-muted">
                          {FREQUENCY_LABEL[a.frequency]} · berilgan {formatDate(a.createdAt)} · muddat {formatDate(a.dueDate)}
                        </div>
                        {a.note && <p className="mt-1 text-sm text-ink-2">{a.note}</p>}
                        <div className="mt-2 flex items-center gap-3">
                          <ProgressBar value={Math.min(doneN, expected)} max={expected} className="flex-1" />
                          <span className="shrink-0 text-xs font-black text-ink tabular">
                            {doneN}/{expected} marta
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant={a.status === "faol" ? "soft" : "ghost"}
                        onClick={() => spAct({ type: "sp.assignment.status", assignmentId: a.id, status: a.status === "faol" ? "bajarildi" : "faol" })}
                      >
                        {a.status === "faol" ? "✅ Bajarildi deb belgilash" : "Qayta faollashtirish"}
                      </Button>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {tab === "xulosa" && (
        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3">
            <CardTitle
              action={
                <Button size="sm" variant="premium" onClick={draft} loading={drafting}>
                  <Sparkles className="h-4 w-4" /> AI qoralama
                </Button>
              }
            >
              ✍️ Ota-onaga tavsiya yoki xulosa
            </CardTitle>
            <div className="space-y-4">
              <OptionPills
                value={kind}
                onChange={(v) => setKind(v as SpecialistNote["kind"])}
                options={[
                  { value: "tavsiya", label: "💡 Tavsiya" },
                  { value: "xulosa", label: "📝 Mutaxassis xulosasi" },
                ]}
              />
              <Textarea rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="Bolaning holati, dinamika, uy mashqlari bo‘yicha tavsiyalar…" />
              <div className="rounded-2xl border border-line px-4">
                <Switch checked={visible} onChange={setVisible} label="Ota-onaga ko‘rsatish" description="Rivojlanish pasportiga qo‘shiladi va Telegram orqali yuboriladi" />
              </div>
              <Button
                block
                disabled={!text.trim()}
                onClick={async () => {
                  await saveNote(kind, text, visible);
                  setText("");
                }}
              >
                Yuborish
              </Button>
            </div>
          </Card>
          <div className="space-y-3 lg:col-span-2">
            <div className="text-lg font-black text-ink">Mening avvalgi yozuvlarim</div>
            {p.notes
              .filter((n) => n.specialistId === specialistId && n.kind !== "hamkasb")
              .sort((a, b) => b.at.localeCompare(a.at))
              .map((n) => (
                <Card key={n.id} className="p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone={n.kind === "xulosa" ? "good" : "brand"}>{n.kind === "xulosa" ? "Xulosa" : "Tavsiya"}</Badge>
                    <span className="text-xs text-faint">{formatDateTime(n.at)}</span>
                    {!n.visibleToParent && <Badge tone="gray">🔒 shaxsiy</Badge>}
                  </div>
                  <p className="text-sm leading-relaxed text-ink-2">{n.text}</p>
                </Card>
              ))}
            {!p.notes.some((n) => n.specialistId === specialistId && n.kind !== "hamkasb") && <p className="text-sm text-muted">Hali yozuvlar yo‘q.</p>}
          </div>
        </div>
      )}

      {tab === "hamkasblar" && (
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-3">
            <InfoNote emoji="🤝">
              Mutaxassislar o‘rtasida bolaning holati bo‘yicha ma’lumot almashish — ota-ona roziligi bilan. Bir bolaga logoped, defektolog, psixolog va fizioterapevt yagona jamoa bo‘lib ishlaydi.
            </InfoNote>
            {colleagues.length === 0 && <EmptyState emoji="🤝" title="Hali izohlar yo‘q" />}
            {[...colleagues]
              .sort((a, b) => b.at.localeCompare(a.at))
              .map((n) => {
                const s = getSpecialist(n.specialistId);
                const mine = n.specialistId === specialistId;
                return (
                  <div key={n.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                    <Avatar name={s?.name} color={s?.color} size={40} />
                    <div className={cn("max-w-[85%] rounded-3xl border p-4 shadow-card", mine ? "rounded-tr-lg border-brand-100 bg-brand-50" : "rounded-tl-lg border-line bg-white")}>
                      <div className="mb-1 text-xs font-extrabold text-ink">
                        {s?.name} <span className="font-semibold text-muted">· {s ? SPECIALTIES[s.specialty].label : ""} · {formatDateTime(n.at)}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-ink-2">{n.text}</p>
                    </div>
                  </div>
                );
              })}
          </div>
          <Card className="self-start p-5 lg:col-span-2">
            <CardTitle>Hamkasblarga yozish</CardTitle>
            <Textarea rows={6} value={colText} onChange={(e) => setColText(e.target.value)} placeholder="Masalan: mashg‘ulotlarda ko‘rsatmalarni qisqa bering…" />
            <Button
              block
              className="mt-3"
              disabled={!colText.trim()}
              onClick={async () => {
                await saveNote("hamkasb", colText, true);
                setColText("");
              }}
            >
              🤝 Yuborish
            </Button>
            <p className="mt-2 text-xs text-muted">Izoh bolaning jamoasidagi barcha mutaxassislarga va ota-onaga ko‘rinadi.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
