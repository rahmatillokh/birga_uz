import type { Metadata } from "next";
import { PronunciationPage } from "@/components/speech/pronunciation";
import { SPEECH_SOUNDS } from "@/data/speech";

type Props = { params: Promise<{ sound: string }> };

function decode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = decode((await params).sound).toLowerCase();
  const s = SPEECH_SOUNDS.find((x) => x.id.toLowerCase() === id);
  return { title: s ? `Talaffuz: «${s.sound}» tovushi` : "Talaffuz tekshiruvi" };
}

export default async function SpeechSoundPage({ params }: Props) {
  const { sound } = await params;
  return <PronunciationPage soundId={decode(sound)} />;
}
