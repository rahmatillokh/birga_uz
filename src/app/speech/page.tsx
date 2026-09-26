import type { Metadata } from "next";
import { SpeechHub } from "@/components/speech/speech-hub";

export const metadata: Metadata = { title: "Nutq va talaffuz" };

export default function SpeechPage() {
  return <SpeechHub />;
}
