import type { Metadata } from "next";
import { BreathingGame } from "@/components/speech/breathing-game";

export const metadata: Metadata = { title: "Nafas mashqi: Shamni o‘chir" };

export default function BreathingPage() {
  return <BreathingGame />;
}
