import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  Settings,
  Building2,
  Globe,
  CalendarCheck2,
  Clock,
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ExternalLink,
  Plus,
  Trash2,
  HelpCircle,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Upload,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { LOGO_URL } from "@/data/siteConfig";
import { adminAuth, type AdminUser, type DashboardData } from "@/services/adminAuth";
import {
  adminSettingsApi,
  type SiteSettingsPayload,
  type SafariDurationOption,
} from "@/services/adminSettings";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Site Settings | Sunset Lagoon Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SettingsPage,
});

type TabId = "business" | "website" | "booking" | "safari" | "system";

export function SettingsPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>("business");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getFieldError = (key: string): string | undefined => fieldErrors[key]?.[0];

  // Form State
  const [form, setForm] = useState<SiteSettingsPayload>({});
  const [defaults, setDefaults] = useState<SiteSettingsPayload>({});
  const [confirmResetModal, setConfirmResetModal] = useState<boolean>(false);

  // Auto-dismiss success notification
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [currentUser, settingsRes, dashData] = await Promise.all([
        adminAuth.getMe(),
        adminSettingsApi.getSettings(),
        adminAuth.getDashboardData().catch(() => null),
      ]);

      setAdmin(currentUser);
      setForm(settingsRes.data || {});
      if (settingsRes.defaults) {
        setDefaults(settingsRes.defaults);
      }
      if (dashData) {
        setDashboardData(dashData);
      }
    } catch (err: any) {
      console.error("Settings load error:", err);
      if (err?.status === 401 || err?.status === 403) {
        navigate({ to: "/admin/login" });
        return;
      }
      const isFetchError = err?.message === "Failed to fetch" || err?.name === "TypeError";
      setError(
        isFetchError
          ? "Unable to connect to the server. Please ensure the backend is running."
          : err?.message || "Failed to load site settings. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!adminAuth.isAuthenticated()) {
      navigate({ to: "/admin/login" });
      return;
    }
    loadSettings();
  }, [navigate, loadSettings]);

  const handleFieldChange = (field: keyof SiteSettingsPayload, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const res = await adminSettingsApi.uploadLogo(file);
      setForm((prev) => ({ ...prev, logo_url: res.logo_url }));
      setSuccessMessage("Website logo uploaded and updated successfully!");
    } catch (err: any) {
      setError(err?.message || "Failed to upload logo image.");
    } finally {
      setUploadingLogo(false);
      if (logoFileInputRef.current) {
        logoFileInputRef.current.value = "";
      }
    }
  };

  const handleResetLogo = async () => {
    setUploadingLogo(true);
    setError(null);
    try {
      await adminSettingsApi.removeLogo();
      setForm((prev) => ({ ...prev, logo_url: null }));
      setSuccessMessage("Website logo reset to system default brand logo.");
    } catch (err: any) {
      setError(err?.message || "Failed to reset logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await adminSettingsApi.updateSettings(form);
      setForm(res.data);
      setSuccessMessage("Site settings updated successfully. Changes are live on the public website.");
    } catch (err: any) {
      console.error("Save settings error:", err);
      setError(err?.message || "Unable to save settings. Please review the highlighted fields.");
      if (err?.errors) {
        setFieldErrors(err.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async (section = "all") => {
    setResetting(true);
    setError(null);
    setConfirmResetModal(false);

    try {
      const res = await adminSettingsApi.resetSettings(section);
      setForm(res.data);
      setSuccessMessage(
        section === "all"
          ? "All settings have been restored to system defaults."
          : `${section.toUpperCase()} settings restored to defaults.`
      );
    } catch (err: any) {
      setError(err?.message || "Failed to restore defaults.");
    } finally {
      setResetting(false);
    }
  };

  // Safari duration helpers
  const durations: SafariDurationOption[] = useMemo(() => {
    return form.safari_durations || defaults.safari_durations || [];
  }, [form.safari_durations, defaults.safari_durations]);

  const handleDurationChange = (index: number, field: keyof SafariDurationOption, value: string) => {
    const updated = [...durations];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: value };
      handleFieldChange("safari_durations", updated);
    }
  };

  const handleAddDuration = () => {
    const newOpt: SafariDurationOption = {
      value: "1.5 Hours",
      label: "1.5 Hours",
      description: "River & Wildlife Experience",
    };
    handleFieldChange("safari_durations", [...durations, newOpt]);
  };

  const handleRemoveDuration = (index: number) => {
    const updated = durations.filter((_, i) => i !== index);
    handleFieldChange("safari_durations", updated);
  };

  // Badges for sidebar
  const badgeCounts = useMemo(
    () => ({
      bookings: dashboardData?.statistics?.pending_bookings ?? 0,
      messages: dashboardData?.statistics?.unread_contact_messages ?? 0,
      reviews: dashboardData?.statistics?.pending_reviews ?? 0,
    }),
    [dashboardData]
  );

  const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "business", label: "Business Info", icon: Building2 },
    { id: "website", label: "Website Content", icon: Globe },
    { id: "booking", label: "Booking Rules", icon: CalendarCheck2 },
    { id: "safari", label: "Safari & Schedule", icon: Clock },
    { id: "system", label: "System Preferences", icon: Sliders },
  ];

  return (
    <AdminLayout admin={admin} pageTitle="Site Settings" badgeCounts={badgeCounts}>
      <div className="space-y-6 max-w-5xl">
        {/* Header Strip */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-xs">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-medium tracking-tight text-amber-100 sm:text-3xl">
                Business & Website Settings
              </h1>
              <p className="text-xs text-slate-400">
                Configure contact channels, website copy, booking limits, and safari schedules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setConfirmResetModal(true)}
              disabled={loading || saving || resetting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={loading || saving}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500 bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success / Error Alerts */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadSettings()}
                className="font-medium text-amber-300 underline hover:text-amber-200 cursor-pointer"
              >
                Retry
              </button>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200 shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-800/80 pb-px scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all rounded-t-lg border-b-2 ${
                    isActive
                      ? "border-amber-400 bg-amber-500/10 text-amber-300 font-semibold"
                      : "border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-6 animate-pulse">
            <div className="h-4 w-48 rounded bg-slate-800" />
            <div className="h-10 w-full rounded bg-slate-800/60" />
            <div className="h-10 w-full rounded bg-slate-800/60" />
            <div className="h-10 w-3/4 rounded bg-slate-800/40" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* TAB 1: BUSINESS INFORMATION */}
            {activeTab === "business" && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-medium text-amber-100">
                    Business Profile & Contact Details
                  </h3>
                  <p className="text-xs text-slate-400">
                    Displayed on the public website footer, contact section, WhatsApp chat, and booking vouchers.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Business Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Business Name <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.business_name ?? ""}
                      onChange={(e) => handleFieldChange("business_name", e.target.value)}
                      placeholder={defaults.business_name ?? "Sunset Lagoon Boat House"}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                    {getFieldError("business_name") && (
                      <p className="text-[11px] text-rose-400">{getFieldError("business_name")}</p>
                    )}
                  </div>

                  {/* Tagline */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Tagline / Slogan</label>
                    <input
                      type="text"
                      value={form.tagline ?? ""}
                      onChange={(e) => handleFieldChange("tagline", e.target.value)}
                      placeholder={defaults.tagline ?? "Bentota Boat Safari"}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Telephone / Mobile <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={form.phone ?? ""}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                        placeholder={defaults.phone ?? "+94 77 123 4567"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      WhatsApp Number <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-2.5 h-3.5 w-3.5 text-emerald-400" />
                      <input
                        type="text"
                        value={form.whatsapp ?? ""}
                        onChange={(e) => handleFieldChange("whatsapp", e.target.value)}
                        placeholder={defaults.whatsapp ?? "+94 77 123 4567"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Powers the public "Chat on WhatsApp" buttons.
                    </p>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="email"
                        value={form.email ?? ""}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        placeholder={defaults.email ?? "info@sunsetlagoon.com"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                    {getFieldError("email") && (
                      <p className="text-[11px] text-rose-400">{getFieldError("email")}</p>
                    )}
                  </div>

                  {/* City & Country */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">City</label>
                      <input
                        type="text"
                        value={form.city ?? ""}
                        onChange={(e) => handleFieldChange("city", e.target.value)}
                        placeholder={defaults.city ?? "Bentota"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Country</label>
                      <input
                        type="text"
                        value={form.country ?? ""}
                        onChange={(e) => handleFieldChange("country", e.target.value)}
                        placeholder={defaults.country ?? "Sri Lanka"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>

                  {/* Physical Address */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Street / Jetty Address</label>
                    <input
                      type="text"
                      value={form.address ?? ""}
                      onChange={(e) => handleFieldChange("address", e.target.value)}
                      placeholder={defaults.address ?? "Bentota River Jetty"}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* Google Maps URL */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Google Maps / Location URL</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                      <input
                        type="url"
                        value={form.google_maps_url ?? ""}
                        onChange={(e) => handleFieldChange("google_maps_url", e.target.value)}
                        placeholder="https://maps.google.com/?q=Bentota+River+Sri+Lanka"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                    {getFieldError("google_maps_url") && (
                      <p className="text-[11px] text-rose-400">{getFieldError("google_maps_url")}</p>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Facebook URL</label>
                    <input
                      type="url"
                      value={form.facebook_url ?? ""}
                      onChange={(e) => handleFieldChange("facebook_url", e.target.value)}
                      placeholder="https://facebook.com/sunsetlagoonbentota"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Instagram URL</label>
                    <input
                      type="url"
                      value={form.instagram_url ?? ""}
                      onChange={(e) => handleFieldChange("instagram_url", e.target.value)}
                      placeholder="https://instagram.com/sunsetlagoonbentota"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* Opening Hours */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Opening / Operational Hours</label>
                    <input
                      type="text"
                      value={form.opening_hours ?? ""}
                      onChange={(e) => handleFieldChange("opening_hours", e.target.value)}
                      placeholder="Daily: 6:00 AM – 6:30 PM"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: WEBSITE CONTENT */}
            {activeTab === "website" && (
              <div className="space-y-6">
                {/* 1. Website Brand Logo Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-amber-100 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-amber-400" />
                        Website Brand Logo
                      </h3>
                      <p className="text-xs text-slate-400">
                        Upload your custom business logo to display across the site navigation header, footer, and admin panel.
                      </p>
                    </div>
                    {form.logo_url && (
                      <button
                        type="button"
                        onClick={handleResetLogo}
                        disabled={uploadingLogo}
                        className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-colors"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset to Default Logo
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                    {/* Logo Preview */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-800 bg-slate-900/80 w-36 h-36 mx-auto sm:mx-0 shrink-0">
                      <img
                        src={form.logo_url || LOGO_URL}
                        alt="Current Website Logo"
                        className="max-h-24 max-w-24 object-contain"
                      />
                      <span className={`mt-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        form.logo_url
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}>
                        {form.logo_url ? "Custom Logo" : "System Default"}
                      </span>
                    </div>

                    {/* Logo Actions & Inputs */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Upload New Logo Image</label>
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            ref={logoFileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                            onChange={handleLogoFileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                          >
                            {uploadingLogo ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                                Uploading Logo...
                              </>
                            ) : (
                              <>
                                <Upload className="h-3.5 w-3.5 text-amber-400" />
                                Browse & Upload Logo
                              </>
                            )}
                          </button>
                          <span className="text-[11px] text-slate-500">
                            Recommended: PNG or SVG with transparent background (max 5MB).
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Or Direct Logo Image URL</label>
                        <input
                          type="url"
                          value={form.logo_url ?? ""}
                          onChange={(e) => handleFieldChange("logo_url", e.target.value)}
                          placeholder={LOGO_URL}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Hero Section Headlines */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-serif text-base font-medium text-amber-100 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      Hero Section Headlines
                    </h3>
                    <p className="text-xs text-slate-400">
                      The primary full-screen visual welcoming visitors at the top of the homepage.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Hero Section Main Title</label>
                      <input
                        type="text"
                        value={form.hero_title ?? ""}
                        onChange={(e) => handleFieldChange("hero_title", e.target.value)}
                        placeholder={defaults.hero_title ?? "Discover the Hidden Beauty of Bentota"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Hero Subtitle / Description</label>
                      <textarea
                        rows={2}
                        value={form.hero_subtitle ?? ""}
                        onChange={(e) => handleFieldChange("hero_subtitle", e.target.value)}
                        placeholder={defaults.hero_subtitle ?? "Cruise through tranquil waters, mangrove forests and the wild beauty of Bentota with Sunset Lagoon Boat House."}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. About Section & Untamed Beauty Intro */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-serif text-base font-medium text-amber-100">
                      About Section & Untamed Beauty Intro
                    </h3>
                    <p className="text-xs text-slate-400">
                      Controls headlines for the "Rooted in Bentota" story and the "Untamed Beauty" intro headline.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">About Section Title</label>
                        <input
                          type="text"
                          value={form.about_title ?? ""}
                          onChange={(e) => handleFieldChange("about_title", e.target.value)}
                          placeholder={defaults.about_title ?? "Rooted in Bentota"}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Untamed Beauty Intro Headline</label>
                        <input
                          type="text"
                          value={form.untamed_beauty_title ?? ""}
                          onChange={(e) => handleFieldChange("untamed_beauty_title", e.target.value)}
                          placeholder={defaults.untamed_beauty_title ?? "An intimate escape into the untamed beauty of the river."}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">About Story Description</label>
                      <textarea
                        rows={3}
                        value={form.about_description ?? ""}
                        onChange={(e) => handleFieldChange("about_description", e.target.value)}
                        placeholder={defaults.about_description ?? "A love for this river shapes the way we welcome people onto the water..."}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Homepage Experiences Section & Cards */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-serif text-base font-medium text-amber-100">
                      Homepage Experiences Section & Cards
                    </h3>
                    <p className="text-xs text-slate-400">
                      Customize the "Choose Your Experience" main title and individual experience card titles.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Homepage Experience Section Title</label>
                      <input
                        type="text"
                        value={form.experience_section_title ?? ""}
                        onChange={(e) => handleFieldChange("experience_section_title", e.target.value)}
                        placeholder={defaults.experience_section_title ?? "Choose Your Experience"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Exp 1: River Safari (Card 1)</label>
                        <input
                          type="text"
                          value={form.experience_1_title ?? ""}
                          onChange={(e) => handleFieldChange("experience_1_title", e.target.value)}
                          placeholder={defaults.experience_1_title ?? "River Safari"}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Exp 2: Mangroves (Card 2)</label>
                        <input
                          type="text"
                          value={form.experience_2_title ?? ""}
                          onChange={(e) => handleFieldChange("experience_2_title", e.target.value)}
                          placeholder={defaults.experience_2_title ?? "Mangrove Adventure"}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Exp 3: Wildlife (Card 3)</label>
                        <input
                          type="text"
                          value={form.experience_3_title ?? ""}
                          onChange={(e) => handleFieldChange("experience_3_title", e.target.value)}
                          placeholder={defaults.experience_3_title ?? "Wildlife Discovery"}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Story Banner & Beyond Shoreline */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-serif text-base font-medium text-amber-100">
                      Story Banner & Beyond Shoreline
                    </h3>
                    <p className="text-xs text-slate-400">
                      Full-width banner with dark overlay celebrating the natural side of Bentota.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Beyond Shoreline (Eyebrow)</label>
                      <input
                        type="text"
                        value={form.story_eyebrow ?? ""}
                        onChange={(e) => handleFieldChange("story_eyebrow", e.target.value)}
                        placeholder={defaults.story_eyebrow ?? "Beyond the shoreline"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Story Banner Headline</label>
                      <input
                        type="text"
                        value={form.story_title ?? ""}
                        onChange={(e) => handleFieldChange("story_title", e.target.value)}
                        placeholder={defaults.story_title ?? "A Different Side of Bentota"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Wildlife Section */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-serif text-base font-medium text-amber-100">
                      Wildlife Section & Life Along River
                    </h3>
                    <p className="text-xs text-slate-400">
                      Showcase river nature, birdlife, and mangrove corridors.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Wildlife Section (Eyebrow)</label>
                      <input
                        type="text"
                        value={form.wildlife_eyebrow ?? ""}
                        onChange={(e) => handleFieldChange("wildlife_eyebrow", e.target.value)}
                        placeholder={defaults.wildlife_eyebrow ?? "Wildlife & nature"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Life Along River (Main Title)</label>
                      <input
                        type="text"
                        value={form.wildlife_title ?? ""}
                        onChange={(e) => handleFieldChange("wildlife_title", e.target.value)}
                        placeholder={defaults.wildlife_title ?? "Life Along the Bentota River"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Gallery, Contact & Footer */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-serif text-base font-medium text-amber-100">
                      Gallery, Contact & Footer Text
                    </h3>
                    <p className="text-xs text-slate-400">
                      Titles for the moments gallery, contact consultation, and footer tagline.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Gallery Section Title</label>
                      <input
                        type="text"
                        value={form.gallery_title ?? ""}
                        onChange={(e) => handleFieldChange("gallery_title", e.target.value)}
                        placeholder={defaults.gallery_title ?? "Moments on the River"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Contact Section Title</label>
                      <input
                        type="text"
                        value={form.contact_title ?? ""}
                        onChange={(e) => handleFieldChange("contact_title", e.target.value)}
                        placeholder={defaults.contact_title ?? "Begin the Conversation"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Footer Tagline Text</label>
                    <input
                      type="text"
                      value={form.footer_text ?? ""}
                      onChange={(e) => handleFieldChange("footer_text", e.target.value)}
                      placeholder={defaults.footer_text ?? "Discover the beauty of Bentota from the water."}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: BOOKING SETTINGS */}
            {activeTab === "booking" && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-medium text-amber-100">
                    Booking Rules & Capacity Constraints
                  </h3>
                  <p className="text-xs text-slate-400">
                    Controls online reservation status, passenger limits, advance notice, and cancellation cutoffs.
                  </p>
                </div>

                {/* Booking Enabled Toggle Card */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-200">Online Bookings Status</span>
                    <p className="text-[11px] text-slate-400">
                      When disabled, visitors are politely redirected to WhatsApp and phone bookings.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.booking_enabled ?? true}
                      onChange={(e) => handleFieldChange("booking_enabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Min Guests */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Minimum Guests per Booking</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={form.min_guests ?? 1}
                      onChange={(e) => handleFieldChange("min_guests", parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                    {getFieldError("min_guests") && (
                      <p className="text-[11px] text-rose-400">{getFieldError("min_guests")}</p>
                    )}
                  </div>

                  {/* Max Guests */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Maximum Guests per Booking</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={form.max_guests ?? 10}
                      onChange={(e) => handleFieldChange("max_guests", parseInt(e.target.value) || 10)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                    {getFieldError("max_guests") && (
                      <p className="text-[11px] text-rose-400">{getFieldError("max_guests")}</p>
                    )}
                  </div>

                  {/* Min Advance Hours */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Minimum Advance Booking Time (Hours)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={720}
                      value={form.min_advance_hours ?? 2}
                      onChange={(e) => handleFieldChange("min_advance_hours", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                    <p className="text-[10px] text-slate-500">
                      Guests must book at least this many hours before boat departure.
                    </p>
                  </div>

                  {/* Cancellation Notice Period */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Cancellation Notice Period (Hours)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={720}
                      value={form.cancellation_notice_hours ?? 24}
                      onChange={(e) => handleFieldChange("cancellation_notice_hours", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    />
                    <p className="text-[10px] text-slate-500">
                      Free cancellation policy displayed on customer booking confirmation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SAFARI & SCHEDULE */}
            {activeTab === "safari" && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-medium text-amber-100">
                    Operational Safari Windows & Durations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure sunrise and sunset expedition time ranges and customize safari package duration choices.
                  </p>
                </div>

                {/* Sunrise Window */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                    <Clock className="h-4 w-4" />
                    <span>Sunrise Safari Operational Window</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Start Time</label>
                      <input
                        type="text"
                        value={form.sunrise_start_time ?? "06:00"}
                        onChange={(e) => handleFieldChange("sunrise_start_time", e.target.value)}
                        placeholder="06:00"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">End Time</label>
                      <input
                        type="text"
                        value={form.sunrise_end_time ?? "08:30"}
                        onChange={(e) => handleFieldChange("sunrise_end_time", e.target.value)}
                        placeholder="08:30"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Sunset Window */}
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-orange-300 font-semibold text-xs">
                    <Clock className="h-4 w-4" />
                    <span>Sunset Safari Operational Window</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Start Time</label>
                      <input
                        type="text"
                        value={form.sunset_start_time ?? "16:30"}
                        onChange={(e) => handleFieldChange("sunset_start_time", e.target.value)}
                        placeholder="16:30"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-orange-500/50 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">End Time</label>
                      <input
                        type="text"
                        value={form.sunset_end_time ?? "18:30"}
                        onChange={(e) => handleFieldChange("sunset_end_time", e.target.value)}
                        placeholder="18:30"
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-orange-500/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Configurable Durations */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">
                        Default Safari Durations
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Available duration options presented in the customer booking form.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDuration}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Option</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {durations.map((dur, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center rounded-lg border border-slate-800 bg-slate-950/70 p-3"
                      >
                        <div className="sm:col-span-3">
                          <label className="text-[10px] text-slate-500 block mb-1">Duration Value</label>
                          <input
                            type="text"
                            value={dur.value}
                            onChange={(e) => handleDurationChange(index, "value", e.target.value)}
                            placeholder="e.g. 2 Hours"
                            className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-100"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="text-[10px] text-slate-500 block mb-1">Display Label</label>
                          <input
                            type="text"
                            value={dur.label}
                            onChange={(e) => handleDurationChange(index, "label", e.target.value)}
                            placeholder="e.g. 2 Hours"
                            className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-100"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="text-[10px] text-slate-500 block mb-1">Description</label>
                          <input
                            type="text"
                            value={dur.description}
                            onChange={(e) => handleDurationChange(index, "description", e.target.value)}
                            placeholder="e.g. Mangrove Caves & Temple"
                            className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-100"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveDuration(index)}
                            disabled={durations.length <= 1}
                            className="rounded p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-30"
                            title="Remove duration option"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: SYSTEM SETTINGS */}
            {activeTab === "system" && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-medium text-amber-100">
                    System & Regional Preferences
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sri Lankan regional standards, currency codes, and time formatting preferences.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Timezone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Timezone</label>
                    <select
                      value={form.timezone ?? "Asia/Colombo"}
                      onChange={(e) => handleFieldChange("timezone", e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500/50 focus:outline-none"
                    >
                      <option value="Asia/Colombo">Asia/Colombo (Sri Lanka Standard Time UTC+5:30)</option>
                      <option value="UTC">UTC (Universal Time Coordinated)</option>
                      <option value="Asia/Dubai">Asia/Dubai (Gulf Standard Time UTC+4)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                    </select>
                  </div>

                  {/* Currency */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Display Currency</label>
                    <select
                      value={form.currency ?? "LKR"}
                      onChange={(e) => handleFieldChange("currency", e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500/50 focus:outline-none"
                    >
                      <option value="LKR">LKR (Sri Lankan Rupee - රු)</option>
                      <option value="USD">USD (US Dollar - $)</option>
                      <option value="EUR">EUR (Euro - €)</option>
                      <option value="GBP">GBP (British Pound - £)</option>
                    </select>
                  </div>

                  {/* Date Format */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Date Format</label>
                    <select
                      value={form.date_format ?? "YYYY-MM-DD"}
                      onChange={(e) => handleFieldChange("date_format", e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500/50 focus:outline-none"
                    >
                      <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-20)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 20/09/2026)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/20/2026)</option>
                      <option value="D MMM YYYY">D MMM YYYY (e.g. 20 Sep 2026)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Bar */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <span className="text-[11px] text-slate-500">
                {form.updated_at
                  ? `Last updated: ${new Date(form.updated_at).toLocaleString()}`
                  : "All changes take effect immediately on public pages."}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmResetModal(true)}
                  disabled={loading || saving}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Reset Defaults
                </button>

                <button
                  type="submit"
                  disabled={loading || saving}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-500 bg-amber-500 px-5 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Reset Confirmation Modal */}
        {confirmResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 to-[#071318] p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-amber-400">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <h3 className="font-serif text-lg font-medium text-amber-200">
                  Restore Default Settings?
                </h3>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-300">
                Are you sure you want to restore settings to the system defaults? You can reset only the current{" "}
                <span className="font-semibold text-amber-300">"{activeTab.toUpperCase()}"</span> section or reset all settings.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmResetModal(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleResetToDefaults(activeTab)}
                  disabled={resetting}
                  className="rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 disabled:opacity-50"
                >
                  Reset {activeTab} Only
                </button>

                <button
                  onClick={() => handleResetToDefaults("all")}
                  disabled={resetting}
                  className="rounded-lg border border-amber-500 bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  Reset All Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
