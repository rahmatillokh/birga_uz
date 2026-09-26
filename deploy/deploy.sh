#!/usr/bin/env bash
# YuniQo’ni VPS’ga yangilash (lokal kompyuterdan):  bash deploy/deploy.sh
# Talab: ~/.ssh/config da "yuniqo-vps" (foydalanuvchi yuniqo) va "edu360-vps" (sudo) aliaslari.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ Kod yuklanmoqda (rsync)…"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .data --exclude .context \
  --exclude .git --exclude '.env*.local' --exclude 'public/mediapipe' --exclude '*.tsbuildinfo' \
  ./ yuniqo-vps:app/

echo "▶ O‘rnatish va build…"
ssh yuniqo-vps 'cd app && npm ci --no-audit --no-fund && npm run build'

echo "▶ Xizmatlarni qayta ishga tushirish…"
ssh edu360-vps 'sudo systemctl restart yuniqo-web && (sudo systemctl is-enabled yuniqo-bot >/dev/null 2>&1 && sudo systemctl restart yuniqo-bot || true)'

sleep 3
if code=$(curl -fsS -o /dev/null -w "%{http_code}" https://yuniqo.aysapps.uz/api/me 2>/dev/null); then
  echo "✔ https://yuniqo.aysapps.uz → $code"
else
  ssh yuniqo-vps 'curl -s -o /dev/null -w "✔ serverda (127.0.0.1:8030) → %{http_code} — HTTPS hali tayyor emas (DNS/SSL)\n" http://127.0.0.1:8030/api/me'
fi
