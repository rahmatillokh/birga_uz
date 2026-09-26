/** Ko‘rgazma paneli uchun oddiy himoya: ADMIN_KEY o‘rnatilgan bo‘lsa, so‘rovda ?key= yoki x-admin-key bo‘lishi shart */
export function adminAllowed(req: Request): boolean {
  const key = process.env.ADMIN_KEY;
  if (!key) return true;
  const url = new URL(req.url);
  return url.searchParams.get("key") === key || req.headers.get("x-admin-key") === key;
}
