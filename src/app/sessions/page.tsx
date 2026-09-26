"use client";

import { Suspense } from "react";
import { SessionsSkeleton, SessionsView } from "@/components/sessions/sessions-view";

export default function SessionsPage() {
  return (
    <Suspense fallback={<SessionsSkeleton />}>
      <SessionsView />
    </Suspense>
  );
}
