import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Truck,
  Store,
  Warehouse,
  Building2,
  Users,
  FileText,
  Undo2,
  Boxes,
  Wallet,
  CalendarCheck,
  HandCoins,
  Banknote,
  ReceiptText,
  BarChart3,
  LogOut,
  Menu,
  X,
  Ship,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { BrandLockup } from "@/components/Brand";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Ringkasan",
    items: [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Master Data",
    items: [
      { to: "/dashboard/barang", label: "Barang", icon: Package },
      { to: "/dashboard/supplier", label: "Supplier", icon: Truck },
      { to: "/dashboard/reseller", label: "Reseller", icon: Store },
      { to: "/dashboard/dpl", label: "DPL", icon: Warehouse },
      { to: "/dashboard/pasar", label: "Pasar", icon: Building2 },
      { to: "/dashboard/karyawan", label: "Karyawan", icon: Users },
    ],
  },
  {
    label: "Transaksi",
    items: [
      { to: "/dashboard/invoice", label: "Invoice", icon: FileText },
      { to: "/dashboard/retur", label: "Retur Barang", icon: Undo2 },
      { to: "/dashboard/pengeluaran", label: "Pengeluaran", icon: ReceiptText },
    ],
  },
  {
    label: "Operasional",
    items: [
      { to: "/dashboard/gudang", label: "Gudang & Stok", icon: Boxes },
      { to: "/dashboard/kas", label: "Kas Harian", icon: Wallet },
    ],
  },
  {
    label: "Sumber Daya Manusia",
    items: [
      { to: "/dashboard/absensi", label: "Absensi", icon: CalendarCheck },
      { to: "/dashboard/utang", label: "Utang Karyawan", icon: HandCoins },
      { to: "/dashboard/slipgaji", label: "Slip Gaji", icon: Banknote },
    ],
  },
  {
    label: "Analisis",
    items: [{ to: "/dashboard/laporan", label: "Laporan & Rekap", icon: BarChart3 }],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <BrandLockup />
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
              {group.label}
            </p>
            <nav className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-40" />
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t p-3">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-2.5 text-[13px] text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          Keluar
        </Button>
      </div>
    </div>
  );
}

function Breadcrumb() {
  const { pathname } = useLocation();
  const all = NAV_GROUPS.flatMap((g) => g.items);
  const current = all.find((i) => i.to === pathname);
  const parent = NAV_GROUPS.find((g) => g.items.some((i) => i.to === pathname));
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">{parent?.label ?? "Aplikasi"}</span>
      <ChevronRight className="size-3.5 text-muted-foreground/50" />
      <span className="font-semibold text-foreground">{current?.label ?? "Dashboard"}</span>
    </div>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card/60 backdrop-blur lg:block print:hidden">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-card shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
              aria-label="Tutup menu"
            >
              <X className="size-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6 print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="size-5" />
            </button>
            <Breadcrumb />
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground sm:flex">
              <Ship className="size-3.5 text-sky-600" />
              PT Dapur Laut
            </span>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {(user?.name ?? "U").slice(0, 1).toUpperCase()}
              </div>
              <span className="hidden text-sm font-medium md:block">{user?.name ?? "User"}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="px-6 py-4 text-center text-xs text-muted-foreground print:hidden">
          © {new Date().getFullYear()} PT Dapur Laut — Sistem Manajemen Bisnis Terpadu
        </footer>
      </div>
    </div>
  );
}
