"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { ProfileSkeleton, SpecialistProfile } from "@/components/specialists/profile";

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export default function SpecialistPage() {
  const params = useParams<{ id: string }>();
  const id = safeDecode(String(params?.id ?? ""));
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <SpecialistProfile key={id} id={id} />
    </Suspense>
  );
}
