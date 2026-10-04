import { useState } from "react";
import { Mail, User, Phone, MessageSquare, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/services/api";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side quick validation
    if (!formData.name.trim()) {
      setError("Please provide your name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }
    if (!formData.message.trim()) {
      setError("Please enter your message or inquiry.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        subject: formData.subject.trim() || null,
        message: formData.message.trim(),
      };

      await api.sendContact(payload);
      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err: any) {
      console.error("Contact form error:", err);
      setError(
        err?.message || "Failed to submit your message. Please try again or message us on WhatsApp."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-6 backdrop-blur-xs sm:p-8">
      {success ? (
        <div className="space-y-4 py-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-2xl font-light tracking-tight text-primary-foreground">
            Message Received
          </h3>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-primary-foreground/70">
            Thank you for reaching out to Sunset Lagoon Boat House Bentota. Our team will review your inquiry and get back to you shortly.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 px-6 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-b border-primary-foreground/10 pb-3">
            <h3 className="font-serif text-xl font-light text-primary-foreground">
              Send Us a Message
            </h3>
            <p className="mt-1 text-xs text-primary-foreground/60">
              Have questions about boat safaris, pricing, or group bookings? Fill out the form below.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70 mb-1.5">
                Full Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 size-4 text-primary-foreground/40" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 py-2.5 pl-9 pr-3 text-xs text-primary-foreground placeholder-primary-foreground/30 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70 mb-1.5">
                Email Address <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-primary-foreground/40" />
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 py-2.5 pl-9 pr-3 text-xs text-primary-foreground placeholder-primary-foreground/30 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70 mb-1.5">
                Phone / WhatsApp (optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 size-4 text-primary-foreground/40" />
                <input
                  type="tel"
                  placeholder="e.g. +44 7123 456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 py-2.5 pl-9 pr-3 text-xs text-primary-foreground placeholder-primary-foreground/30 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70 mb-1.5">
                Subject (optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 size-4 text-primary-foreground/40" />
                <input
                  type="text"
                  placeholder="e.g. Sunset Safari Booking Inquiry"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 py-2.5 pl-9 pr-3 text-xs text-primary-foreground placeholder-primary-foreground/30 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70 mb-1.5">
              Message <span className="text-amber-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Tell us about your plans, preferred dates, group size, or questions..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 p-3 text-xs text-primary-foreground placeholder-primary-foreground/30 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-accent-foreground shadow-md transition-transform hover:scale-[1.01] hover:brightness-105 disabled:opacity-50 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Sending message...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
