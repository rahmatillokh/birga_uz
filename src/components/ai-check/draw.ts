// Kanvasga chizish: skelet (brend osmon rangida), yuz chiziqlari, demo rejim sahnasi.
// Kanvas CSS orqali ko‘zgudek aylantiriladi — bu yerda koordinatalar kameraning o‘z tasvirida.
import { BODY_CONNECTIONS, BODY_JOINTS, P } from "@/lib/vision/geometry";
import type { Connection } from "@/lib/vision/loader";
import type { Lm } from "@/lib/vision/types";

const SKY = "#0ea5e9";
const SKY_DARK = "#0369a1";
const BAD = "#ef4444";
const HALO = "rgba(255,255,255,0.6)";

const MAJOR = new Set<number>([P.lElbow, P.rElbow, P.lKnee, P.rKnee, P.lWrist, P.rWrist]);

export function drawPose(ctx: CanvasRenderingContext2D, lm: Lm[], W: number, H: number, opts: { bad: number[]; t: number }) {
  const bad = new Set(opts.bad);
  const ok = (i: number) => !!lm[i] && (lm[i].visibility ?? 1) >= 0.45;
  const X = (i: number) => lm[i].x * W;
  const Y = (i: number) => lm[i].y * H;
  const base = Math.max(3, Math.min(W, H) * 0.011);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Oq "halo" — har qanday fonda ko‘rinishi uchun
  ctx.strokeStyle = HALO;
  ctx.lineWidth = base + 5;
  ctx.beginPath();
  for (const [a, b] of BODY_CONNECTIONS) {
    if (!ok(a) || !ok(b)) continue;
    ctx.moveTo(X(a), Y(a));
    ctx.lineTo(X(b), Y(b));
  }
  ctx.stroke();

  // Suyaklar
  ctx.lineWidth = base;
  for (const [a, b] of BODY_CONNECTIONS) {
    if (!ok(a) || !ok(b)) continue;
    ctx.strokeStyle = bad.has(a) || bad.has(b) ? BAD : SKY;
    ctx.beginPath();
    ctx.moveTo(X(a), Y(a));
    ctx.lineTo(X(b), Y(b));
    ctx.stroke();
  }

  // Bosh (quloqlar orasidagi masofa bo‘yicha aylana)
  if (ok(P.nose) && ok(P.lShoulder) && ok(P.rShoulder)) {
    const earOk = ok(P.lEar) && ok(P.rEar);
    const shoulderW = Math.hypot(X(P.lShoulder) - X(P.rShoulder), Y(P.lShoulder) - Y(P.rShoulder));
    // Yon tomondan (profil) quloqlar ustma-ust tushadi — yelka kengligidan kichik bo‘lmasin
    const r = Math.max(earOk ? Math.hypot(X(P.lEar) - X(P.rEar), Y(P.lEar) - Y(P.rEar)) * 0.62 : shoulderW * 0.3, shoulderW * 0.22, base * 2);
    const cx = earOk ? (X(P.lEar) + X(P.rEar)) / 2 : X(P.nose);
    const cy = earOk ? (Y(P.lEar) + Y(P.rEar)) / 2 : Y(P.nose);
    ctx.lineWidth = base * 0.8;
    ctx.strokeStyle = HALO;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = SKY;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Bo‘g‘imlar
  const pulse = 0.5 + 0.5 * Math.sin(opts.t / 140);
  for (const i of BODY_JOINTS) {
    if (!ok(i)) continue;
    const x = X(i);
    const y = Y(i);
    const r = base * (MAJOR.has(i) ? 1.05 : 0.8);
    if (bad.has(i)) {
      ctx.fillStyle = `rgba(239,68,68,${0.18 + 0.2 * pulse})`;
      ctx.beginPath();
      ctx.arc(x, y, r * (2.4 + pulse), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = bad.has(i) ? BAD : "#ffffff";
    ctx.strokeStyle = bad.has(i) ? "#ffffff" : SKY_DARK;
    ctx.lineWidth = Math.max(1.5, base * 0.35);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function strokeConnections(ctx: CanvasRenderingContext2D, lm: Lm[], conns: Connection[], W: number, H: number) {
  ctx.beginPath();
  for (const c of conns) {
    const a = lm[c.start];
    const b = lm[c.end];
    if (!a || !b) continue;
    ctx.moveTo(a.x * W, a.y * H);
    ctx.lineTo(b.x * W, b.y * H);
  }
  ctx.stroke();
}

export function drawFace(
  ctx: CanvasRenderingContext2D,
  lm: Lm[],
  W: number,
  H: number,
  opts: { warn: boolean; lips?: Connection[]; oval?: Connection[] },
) {
  const base = Math.max(2, Math.min(W, H) * 0.006);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (opts.oval) {
    ctx.setLineDash([base * 2, base * 2.5]);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = base * 0.8;
    strokeConnections(ctx, lm, opts.oval, W, H);
    ctx.setLineDash([]);
  }
  if (opts.lips) {
    ctx.strokeStyle = HALO;
    ctx.lineWidth = base * 2.4;
    strokeConnections(ctx, lm, opts.lips, W, H);
    ctx.strokeStyle = opts.warn ? BAD : SKY;
    ctx.lineWidth = base * 1.4;
    strokeConnections(ctx, lm, opts.lips, W, H);
  }
  // Og‘iz burchaklari (tabassum kengligi)
  for (const i of [61, 291]) {
    const p = lm[i];
    if (!p) continue;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = opts.warn ? BAD : SKY_DARK;
    ctx.lineWidth = base * 0.6;
    ctx.beginPath();
    ctx.arc(p.x * W, p.y * H, base * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Demo rejim sahnasi
// ---------------------------------------------------------------------------

export function drawDemoBackground(ctx: CanvasRenderingContext2D, W: number, H: number, face: boolean) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  if (face) {
    g.addColorStop(0, "#e0f2fe");
    g.addColorStop(1, "#fdf2f8");
  } else {
    g.addColorStop(0, "#e0f2fe");
    g.addColorStop(0.9, "#f0f9ff");
    g.addColorStop(0.9, "#dbeafe");
    g.addColorStop(1, "#dbeafe");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // nuqtali naqsh
  ctx.fillStyle = "rgba(14,165,233,0.10)";
  const step = Math.max(18, W / 32);
  for (let y = step / 2; y < H; y += step) for (let x = step / 2; x < W; x += step) ctx.fillRect(x, y, 2, 2);
}

/** Sun’iy bolaning tanasi (skelet ostida yumshoq "go‘sht") */
export function drawDemoFigure(ctx: CanvasRenderingContext2D, lm: Lm[], W: number, H: number) {
  const X = (i: number) => lm[i].x * W;
  const Y = (i: number) => lm[i].y * H;
  const base = Math.max(6, Math.min(W, H) * 0.035);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Soya
  const fy = Math.max(Y(P.lFoot), Y(P.rFoot), Y(P.lHeel), Y(P.rHeel));
  ctx.fillStyle = "rgba(15,23,42,0.08)";
  ctx.beginPath();
  ctx.ellipse((X(P.lFoot) + X(P.rFoot)) / 2, fy + base * 0.4, base * 3.2, base * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  const limb = (a: number, b: number, w: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(X(a), Y(a));
    ctx.lineTo(X(b), Y(b));
    ctx.stroke();
  };
  // Oyoqlar (shim), tana (futbolka), qo‘llar
  const pants = "#7dd3fc";
  const shirt = "#fbbf24";
  const skin = "#fcd9b8";
  limb(P.lHip, P.lKnee, base * 1.15, pants);
  limb(P.lKnee, P.lAnkle, base, pants);
  limb(P.rHip, P.rKnee, base * 1.15, pants);
  limb(P.rKnee, P.rAnkle, base, pants);
  limb(P.lAnkle, P.lFoot, base * 0.7, "#334155");
  limb(P.rAnkle, P.rFoot, base * 0.7, "#334155");
  // tana — to‘rtburchak
  ctx.fillStyle = shirt;
  ctx.strokeStyle = shirt;
  ctx.lineWidth = base * 0.8;
  ctx.beginPath();
  ctx.moveTo(X(P.lShoulder), Y(P.lShoulder));
  ctx.lineTo(X(P.rShoulder), Y(P.rShoulder));
  ctx.lineTo(X(P.rHip), Y(P.rHip));
  ctx.lineTo(X(P.lHip), Y(P.lHip));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  limb(P.lShoulder, P.lElbow, base * 0.85, shirt);
  limb(P.rShoulder, P.rElbow, base * 0.85, shirt);
  limb(P.lElbow, P.lWrist, base * 0.75, skin);
  limb(P.rElbow, P.rWrist, base * 0.75, skin);

  // Bosh
  const hx = (X(P.lEar) + X(P.rEar)) / 2;
  const hy = (Y(P.lEar) + Y(P.rEar)) / 2;
  const hr = Math.hypot(X(P.lEar) - X(P.rEar), Y(P.lEar) - Y(P.rEar)) * 0.72;
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI * 2);
  ctx.fill();
  // soch
  ctx.fillStyle = "#7c4a2d";
  ctx.beginPath();
  ctx.arc(hx, hy - hr * 0.15, hr * 1.02, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  // ko‘zlar va tabassum
  ctx.fillStyle = "#1e293b";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(hx + s * hr * 0.36, hy - hr * 0.02, hr * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = Math.max(2, hr * 0.1);
  ctx.beginPath();
  ctx.arc(hx, hy + hr * 0.2, hr * 0.38, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.restore();
}

/** Multfilm yuz: tabassum va naycha blendshape qiymatlariga qarab */
export function drawCartoonFace(ctx: CanvasRenderingContext2D, W: number, H: number, blend: Record<string, number>, warn: boolean) {
  const s = Math.min(1, Math.max(0, ((blend.mouthSmileLeft ?? 0) + (blend.mouthSmileRight ?? 0)) / 2));
  const p = Math.min(1, Math.max(0, blend.mouthPucker ?? 0));
  const cx = W / 2;
  const cy = H * 0.5;
  const r = Math.min(W, H) * 0.33;
  ctx.save();

  // Quloqlar, yuz
  ctx.fillStyle = "#f8c9a0";
  for (const k of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + k * r * 0.98, cy + r * 0.05, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#fcd9b8";
  ctx.beginPath();
  ctx.ellipse(cx, cy, r, r * 1.08, 0, 0, Math.PI * 2);
  ctx.fill();
  // Soch
  ctx.fillStyle = "#7c4a2d";
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.62, r * 0.98, r * 0.5, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Yonoqlar
  ctx.fillStyle = `rgba(244,114,182,${0.18 + 0.35 * s})`;
  for (const k of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + k * r * 0.55, cy + r * 0.28, r * 0.17, r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Ko‘zlar (tabassumda — "baxtli" yoy)
  ctx.fillStyle = "#1e293b";
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = r * 0.06;
  ctx.lineCap = "round";
  for (const k of [-1, 1]) {
    const ex = cx + k * r * 0.36;
    const ey = cy - r * 0.08;
    if (s > 0.55) {
      ctx.beginPath();
      ctx.arc(ex, ey + r * 0.05, r * 0.11, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(ex, ey, r * 0.075, r * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Og‘iz
  const my = cy + r * 0.45;
  const lipColor = warn ? BAD : "#e11d48";
  if (p > s && p > 0.2) {
    // Naycha — oldinga cho‘zilgan "o"
    const rx = r * (0.2 - 0.07 * p);
    const ry = r * (0.13 + 0.05 * p);
    ctx.fillStyle = "#f472b6";
    ctx.beginPath();
    ctx.ellipse(cx, my, rx * 1.35, ry * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#9f1239";
    ctx.beginPath();
    ctx.ellipse(cx, my, rx * 0.55, ry * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = lipColor;
    ctx.lineWidth = r * 0.035;
    ctx.beginPath();
    ctx.ellipse(cx, my, rx * 1.35, ry * 1.3, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Tabassum — kenglik va egilish s ga bog‘liq
    const w = r * (0.42 + 0.4 * s);
    const curve = r * (0.06 + 0.32 * s);
    ctx.fillStyle = "#9f1239";
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, my);
    ctx.quadraticCurveTo(cx, my + curve * 1.6, cx + w / 2, my);
    ctx.quadraticCurveTo(cx, my + curve * 0.35, cx - w / 2, my);
    ctx.fill();
    if (s > 0.35) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.38, my + curve * 0.12);
      ctx.quadraticCurveTo(cx, my + curve * 0.5, cx + w * 0.38, my + curve * 0.12);
      ctx.quadraticCurveTo(cx, my + curve * 0.3, cx - w * 0.38, my + curve * 0.12);
      ctx.fill();
    }
    ctx.strokeStyle = lipColor;
    ctx.lineWidth = r * 0.035;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, my);
    ctx.quadraticCurveTo(cx, my + curve * 1.6, cx + w / 2, my);
    ctx.stroke();
    // og‘iz burchaklari
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = warn ? BAD : SKY_DARK;
    ctx.lineWidth = r * 0.02;
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(cx + (k * w) / 2, my, r * 0.035, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.restore();
}
