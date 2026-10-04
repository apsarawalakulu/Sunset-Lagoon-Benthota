import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, User, Database } from "lucide-react";
import { adminAuth } from "@/services/adminAuth";
import { LOGO_URL } from "@/data/siteConfig";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Portal Login | Sunset Lagoon Boat House" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dbState, setDbState] = useState<{ configured: boolean; needsSetup: boolean } | null>(null);
  const [setupName, setSetupName] = useState("");

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    let isMounted = true;
    adminAuth
      .dbStatus()
      .then((s) => {
        if (isMounted) setDbState(s);
      })
      .catch(() => {
        if (isMounted) setDbState({ configured: false, needsSetup: false });
      });
    if (adminAuth.isAuthenticated()) {
      adminAuth
        .getMe()
        .then(() => {
          if (isMounted) {
            navigate({ to: "/admin/dashboard" });
          }
        })
        .catch(() => {
          if (isMounted) {
            setVerifying(false);
          }
        });
    } else {
      setVerifying(false);
    }

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSetup = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!setupName.trim() || !email.trim() || !password) {
      setErrorMessage("Please enter your name, email address and a password.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await adminAuth.setup({ name: setupName.trim(), email: email.trim(), password });
      navigate({ to: "/admin/dashboard" });
    } catch (err: any) {
      console.error("Admin setup error:", err);
      setErrorMessage(err?.message || "Setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email address and password.");
      return;
    }

    setLoading(true);
    try {
      await adminAuth.login({
        email: email.trim(),
        password,
      });
      navigate({ to: "/admin/dashboard" });
    } catch (err: any) {
      console.error("Admin login error:", err);
      const msg =
        err?.message ||
        (err?.status === 401
          ? "Invalid email or password."
          : err?.status === 403
            ? "Access denied. Only administrator accounts are permitted."
            : "An unexpected error occurred during authentication.");
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex items-center gap-3 text-sm text-slate-400 font-sans">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          <span>Verifying admin session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#071318] px-4 py-12 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-amber-600/10 blur-[140px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Top return link */}
        <div className="mb-6 flex justify-between items-center text-xs font-medium">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Public Website</span>
          </a>
          <span className="flex items-center gap-1 text-slate-500 text-[11px] font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Neon Postgres</span>
          </span>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="border-b border-slate-800/80 bg-gradient-to-b from-slate-800/40 to-transparent p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/20 bg-slate-950 p-2 shadow-inner">
              <img
                src={LOGO_URL}
                alt="Sunset Lagoon"
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="font-serif text-2xl font-medium tracking-wide text-amber-100">
              Sunset Lagoon
            </h1>
            <p className="mt-1 font-sans text-xs uppercase tracking-widest text-amber-400/80 font-medium">
              Administrative Portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={dbState?.needsSetup ? handleSetup : handleSubmit} className="p-6 space-y-4.5">
            {dbState && !dbState.configured && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-950/40 p-3 text-xs text-amber-200 animate-fade-in">
                <Database className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="flex-1 font-sans leading-relaxed">
                  Database not connected. Add your Neon <span className="font-mono">DATABASE_URL</span> to the
                  <span className="font-mono"> .env</span> file and restart the server, then refresh this page.
                </div>
              </div>
            )}
            {dbState?.needsSetup && (
              <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-200 animate-fade-in">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <div className="flex-1 font-sans leading-relaxed">
                  First-time setup: create your admin account. Demo site content will be seeded automatically.
                </div>
              </div>
            )}
            {errorMessage && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-200 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <div className="flex-1 font-sans leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {dbState?.needsSetup && (
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="admin-name"
                    type="text"
                    required
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    placeholder="e.g. Lagoon Admin"
                    autoComplete="name"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/70 pl-9.5 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/70"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Admin Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sunsetlagoon.com"
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 pl-9.5 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/70"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 pl-9.5 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:border-amber-400/70 focus:ring-1 focus:ring-amber-400/70"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || (dbState !== null && !dbState.configured)}
              className="relative mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-600/20 transition-all duration-200 hover:opacity-95 hover:shadow-amber-500/30 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>{dbState?.needsSetup ? "Setting up..." : "Authenticating..."}</span>
                </>
              ) : (
                <span>{dbState?.needsSetup ? "Create Admin & Seed Demo Content" : "Sign in to Dashboard"}</span>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="border-t border-slate-800/60 bg-slate-950/40 px-6 py-3.5 text-center text-[11px] text-slate-500">
            Protected area. Unauthorized access is strictly prohibited and monitored.
          </div>
        </div>
      </div>
    </div>
  );
}
