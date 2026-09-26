import type { Metadata } from "next";
import { LoudnessGame } from "@/components/speech/loudness-game";

export const metadata: Metadata = { title: "Ovoz kuchi: Sher va sichqoncha" };

export default function LoudnessPage() {
  return <LoudnessGame />;
}
