import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AdminLayout } from "./AdminLayout";
import { adminAuth, type AdminUser } from "@/services/adminAuth";
import { Loader2, ArrowLeft, Clock } from "lucide-react";

interface AdminPlaceholderProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  moduleName: string;
}

export function AdminPlaceholder({
  title,
  description,
  icon: Icon,
  moduleName,
}: AdminPlaceholderProps) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      if (!adminAuth.isAuthenticated()) {
        navigate({ to: "/admin/login" });
        return;
      }
      try {
        const user = await adminAuth.getMe();
        if (isMounted) {
          setAdmin(user);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          navigate({ to: "/admin/login" });
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071318] text-slate-200 font-sans">
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          <span>Verifying admin session...</span>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout admin={admin} pageTitle={title}>
      <div className="max-w-4xl space-y-6">
        <div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/60 p-8 sm:p-12 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-inner">
            <Icon className="h-8 w-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
            <Clock className="h-3 w-3" />
            <span>Module Scheduled</span>
          </div>

          <h1 className="mt-4 font-serif text-3xl font-medium text-amber-100 sm:text-4xl">
            {title}
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400 leading-relaxed">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-amber-400 transition-colors shadow-md"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to Dashboard Overview</span>
            </Link>
          </div>

          <div className="mt-10 border-t border-slate-800/80 pt-6 text-[11px] text-slate-500 font-mono">
            Sunset Lagoon Boat House · Admin Portal Module: {moduleName}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
