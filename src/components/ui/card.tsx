import Link from "next/link";
import { cn } from "@/lib/utils";

export function Card({
  className,
  href,
  children,
  onClick,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { href?: string }) {
  const cls = cn("rounded-3xl border border-line bg-white shadow-card print-plain", (href || onClick) && "transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop cursor-pointer", className);
  if (href) {
    return (
      <Link href={href} className={cn("block", cls)}>
        {children}
      </Link>
    );
  }
  return (
    <div className={cls} onClick={onClick} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, action }: { className?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h3 className="text-[17px] font-extrabold text-ink">{children}</h3>
      {action}
    </div>
  );
}
