import type { Analyzer, CameraCheckId } from "../types";
import { AirplaneAnalyzer } from "./airplane";
import { ArmsUpAnalyzer } from "./arms-up";
import { BalanceAnalyzer } from "./balance";
import { SmilePuckerAnalyzer } from "./smile-pucker";
import { SquatAnalyzer } from "./squat";
import { TiptoeAnalyzer } from "./tiptoe";

/** Har bir sessiya uchun yangi tahlilchi */
export function createAnalyzer(id: CameraCheckId): Analyzer {
  switch (id) {
    case "arms-up":
      return new ArmsUpAnalyzer();
    case "squat":
      return new SquatAnalyzer();
    case "balance":
      return new BalanceAnalyzer();
    case "tiptoe":
      return new TiptoeAnalyzer();
    case "airplane":
      return new AirplaneAnalyzer();
    case "smile-pucker":
      return new SmilePuckerAnalyzer();
  }
}
