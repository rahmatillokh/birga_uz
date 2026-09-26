"use client";

import { Suspense } from "react";
import { CatalogSkeleton, SpecialistsCatalog } from "@/components/specialists/catalog";

export default function SpecialistsPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <SpecialistsCatalog />
    </Suspense>
  );
}
