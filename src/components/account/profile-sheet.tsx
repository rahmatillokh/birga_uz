"use client";

import { useState } from "react";
import { getRegion, REGIONS } from "@/data/regions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Sheet } from "@/components/ui/sheet";
import { useView } from "@/lib/client/hooks";
import { toast } from "@/lib/client/toast";
import { safeAct } from "./act";

/** Ota-ona profilini tahrirlash (ism, telefon, hudud). Ochilganda render qiling. */
export function ProfileSheet({ onClose }: { onClose: () => void }) {
  const { user } = useView();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [region, setRegion] = useState(user.region ?? "");
  const [district, setDistrict] = useState(user.district ?? "");
  const [busy, setBusy] = useState(false);
  const districts = getRegion(region)?.districts ?? [];

  const save = async () => {
    if (!name.trim()) {
      toast.error("Ismingizni kiriting");
      return;
    }
    setBusy(true);
    const r = await safeAct(
      {
        type: "user.update",
        patch: { name: name.trim(), phone: phone.trim(), ...(region ? { region } : {}), ...(district ? { district } : {}) },
      },
      { silent: true },
    );
    setBusy(false);
    if (r.ok) {
      toast.success("Profil yangilandi");
      onClose();
    } else {
      toast.error(r.error ?? "Saqlab bo‘lmadi");
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title="Profilni tahrirlash"
      size="sm"
      footer={
        <Button block size="lg" loading={busy} onClick={save}>
          Saqlash
        </Button>
      }
    >
      <div className="space-y-4 pt-1">
        <Field label="Ism va familiya">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Gulnoza Rahimova" autoComplete="name" />
        </Field>
        <Field label="Telefon raqam" hint="Mutaxassis qabulni tasdiqlash uchun bog‘lanishi mumkin">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" inputMode="tel" autoComplete="tel" />
        </Field>
        <Field label="Viloyat">
          <Select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              setDistrict("");
            }}
          >
            <option value="">Tanlang</option>
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tuman / shahar" hint="Hududingizdagi bepul sessiyalar shu bo‘yicha ko‘rsatiladi">
          <Select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!districts.length}>
            <option value="">Tanlang</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Sheet>
  );
}
