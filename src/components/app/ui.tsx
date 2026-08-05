import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export function PageHeader({
  title,
  description,
  actions,
  icon: Icon,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  sub,
  loading,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: "default" | "income" | "expense" | "stock" | "brand";
  sub?: string;
  loading?: boolean;
}) {
  const tones: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    income: "bg-sky-50 text-sky-600",
    expense: "bg-rose-50 text-rose-600",
    stock: "bg-emerald-50 text-emerald-600",
    brand: "bg-teal-50 text-teal-600",
  };
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {Icon && (
          <div className={cn("flex size-8 items-center justify-center rounded-lg", tones[tone])}>
            <Icon className="size-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-28" />
        ) : (
          <>
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/70 shadow-none", className)}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <div>
            {title && <CardTitle className="text-base">{title}</CardTitle>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <Empty>
      <EmptyHeader>
        {Icon && (
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

export function BadgeStatus({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const map: Record<string, string> = {
    Hadir: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Izin: "bg-amber-50 text-amber-700 border-amber-200",
    Sakit: "bg-orange-50 text-orange-700 border-orange-200",
    Alpa: "bg-rose-50 text-rose-700 border-rose-200",
    Lunas: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Parsial: "bg-amber-50 text-amber-700 border-amber-200",
    Belum: "bg-rose-50 text-rose-700 border-rose-200",
    Supplier: "bg-sky-50 text-sky-700 border-sky-200",
    Reseller: "bg-teal-50 text-teal-700 border-teal-200",
    DPL: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Pasar: "bg-violet-50 text-violet-700 border-violet-200",
    Retur: "bg-orange-50 text-orange-700 border-orange-200",
    Manual: "bg-slate-100 text-slate-700 border-slate-300",
    Modal: "bg-sky-50 text-sky-700 border-sky-200",
    Penjualan: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Baku: "bg-sky-50 text-sky-700 border-sky-200",
    Jadi: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        map[status] ?? "bg-slate-100 text-slate-700 border-slate-300",
        className,
      )}
    >
      {status}
    </span>
  );
}
