import type { Metadata } from "next";
import { ArticulationMirror } from "@/components/speech/articulation-mirror";

export const metadata: Metadata = { title: "Artikulyatsion gimnastika" };

export default async function MirrorPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { ex } = await searchParams;
  return <ArticulationMirror initialId={typeof ex === "string" ? ex : undefined} />;
}
