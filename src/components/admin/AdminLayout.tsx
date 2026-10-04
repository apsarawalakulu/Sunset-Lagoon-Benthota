import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarCheck2,
  Compass,
  MessageSquareQuote,
  Image as ImageIcon,
  Mail,
  Settings,
  Clock,
  Ship,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  Loader2,
  ChevronRight,
  ChartColumn,
} from "lucide-react";
import { adminAuth, type AdminUser } from "@/services/adminAuth";
import { LOGO_URL } from "@/data/siteConfig";
import { useSiteSettings } from "@/hooks/useApiData";

interface AdminLayoutProps {
  children: ReactNode;
  admin: AdminUser | null;
  pageTitle?: string;
  badgeCounts?: {
    bookings?: number;
    messages?: number;
    reviews?: number;
  };
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: "bookings" | "messages" | "reviews";
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/admin/analytics", icon: ChartColumn },
  { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck2, badgeKey: "bookings" },
  { label: "Safari Schedule", href: "/admin/schedules", icon: Clock },
  { label: "Experiences", href: "/admin/experiences", icon: Compass },
  { label: "Boats", href: "/admin/boats", icon: Ship },
  { label: "Reviews", href: "/admin/reviews", icon: MessageSquareQuote, badgeKey: "reviews" },
  { label: "Media & Photos", href: "/admin/media", icon: ImageIcon },
  { label: "Contact Messages", href: "/admin/messages", icon: Mail, badgeKey: "messages" },
  { label: "Site Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayout({
  children,
  admin,
  pageTitle = "Dashboard",
  badgeCounts,
}: AdminLayoutProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { data: liveSettings } = useSiteSettings();
  const logoUrl = liveSettings?.logo_url || LOGO_URL;

  // The admin theme is dark: flip the design-system tokens while any admin
  // page is mounted (including Radix portals, which render into document.body).
  useEffect(() => {
    document.body.classList.add("dark");
    return () => {
      document.body.classList.remove("dark");
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await adminAuth.logout();
    } finally {
      navigate({ to: "/admin/login" });
    }
  };

  const NavLinkList = ({ onSelect }: { onSelect?: () => void }) => (
    <nav className="space-y-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/admin/dashboard"
            ? currentPath === "/admin/dashboard"
            : currentPath.startsWith(item.href);

        const badgeValue = item.badgeKey && badgeCounts ? badgeCounts[item.badgeKey] : undefined;

        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => onSelect?.()}
            className={`group flex items-center justify-between rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all duration-200 ${
              isActive
                ? "bg-amber-500/15 text-amber-300 font-semibold shadow-xs border-l-2 border-amber-400 pl-3"
                : "text-slate-300 hover:bg-slate-800/60 hover:text-amber-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                className={`h-4 w-4 transition-colors ${
                  isActive ? "text-amber-400" : "text-slate-400 group-hover:text-amber-300"
                }`}
              />
              <span>{item.label}</span>
            </div>

            {typeof badgeValue === "number" && badgeValue > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                {badgeValue}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#071318] text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Slide-over */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-[#09181f] border-r border-slate-800 transition-transform duration-300 ease-in-out lg:hidden flex flex-col justify-between ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/20 bg-slate-900 p-1">
                <img src={logoUrl} alt="Sunset Lagoon" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="font-serif text-base font-medium text-amber-100">Sunset Lagoon</div>
                <div className="text-[10px] uppercase tracking-wider text-amber-400/80">Admin Portal</div>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <NavLinkList onSelect={() => setMobileOpen(false)} />
        </div>

        {/* Mobile Sidebar Footer */}
        <div className="border-t border-slate-800/80 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-amber-300 uppercase">
              {admin?.name ? admin.name.charAt(0) : "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-xs font-medium text-slate-200">{admin?.name || "Administrator"}</div>
              <div className="truncate text-[10px] text-slate-400">{admin?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-900/40"
          >
            {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-800/90 bg-[#08151c] lg:flex flex-col justify-between print:hidden">
        <div>
          {/* Brand Header */}
          <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-5 bg-slate-950/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/20 bg-slate-900 p-1 shadow-inner">
              <img src={logoUrl} alt="Sunset Lagoon" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="font-serif text-base font-medium tracking-wide text-amber-100">
                Sunset Lagoon
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-amber-400/80 font-medium">
                  Boat House Bentota
                </span>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <NavLinkList />
        </div>

        {/* Sidebar Footer / Security indicator */}
        <div className="border-t border-slate-800/80 bg-slate-950/50 p-4 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-mono text-emerald-400">
              <Shield className="h-3.5 w-3.5" />
              <span>System Online</span>
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              Admin Role
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-xs font-bold text-slate-950">
              {admin?.name ? admin.name.charAt(0) : "A"}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-xs font-medium text-slate-200">
                {admin?.name || "Administrator"}
              </div>
              <div className="truncate text-[10px] text-slate-400 font-mono">
                {admin?.email}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen print:pl-0 print:m-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#071318]/90 px-4 sm:px-6 lg:px-8 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Admin</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-amber-200 font-semibold">{pageTitle}</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:border-amber-400/50 hover:text-amber-300 transition-colors"
            >
              <span className="hidden sm:inline">View Public Website</span>
              <span className="sm:hidden">Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loggingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#060e12]">
          {children}
        </main>
      </div>
    </div>
  );
}
