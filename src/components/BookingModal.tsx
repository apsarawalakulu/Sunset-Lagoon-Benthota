import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  Sailboat,
  ShieldCheck,
  Sun,
  Sunset,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES } from "@/data/countries";
import { experiences as localExperiences } from "@/data/experiences";
import { useExperiences, useSiteSettings } from "@/hooks/useApiData";
import {
  api,
  ApiError,
  isApiConnected,
  type BookingPayload,
  type BookingResponseData,
  type DepartureSlot,
} from "@/services/api";

export const DURATION_OPTIONS = [
  { value: "1 Hour", label: "1 Hour", description: "River & Lagoon Highlights" },
  { value: "2 Hours", label: "2 Hours", description: "Mangrove Caves & Temple" },
  { value: "3 Hours", label: "3 Hours", description: "Wildlife & Mangrove Tunnels" },
  { value: "4 Hours", label: "4 Hours", description: "Grand Safari Comprehensive" },
] as const;

export type SafariDuration = string;
export type SafariTimeOption = "sunrise" | "sunset" | "preferred";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedExperienceId?: number | string | null | undefined;
}

function formatTimeTo12Hour(time24: string): string {
  if (!time24) return "";
  const parts = time24.split(":");
  const hours = parseInt(parts[0] ?? "0", 10);
  const minutes = parts[1] ?? "00";
  if (isNaN(hours)) return time24;
  const ampm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
}

export function BookingModal({
  open,
  onOpenChange,
  preselectedExperienceId,
}: BookingModalProps) {
  const { data: apiSettings } = useSiteSettings();
  const { data: apiExperiences } = useExperiences();

  // Dynamic settings with defaults
  const minGuests = apiSettings?.min_guests ?? 1;
  const maxGuestsSetting = apiSettings?.max_guests ?? 8;
  const isBookingEnabled = apiSettings?.booking_enabled !== false;
  const cancellationNoticeHours = apiSettings?.cancellation_notice_hours ?? 24;

  const sunriseLabel = apiSettings?.sunrise_start_time && apiSettings?.sunrise_end_time
    ? `${apiSettings.sunrise_start_time} – ${apiSettings.sunrise_end_time}`
    : "06:30 – 07:00 AM";

  const sunsetLabel = apiSettings?.sunset_start_time && apiSettings?.sunset_end_time
    ? `${apiSettings.sunset_start_time} – ${apiSettings.sunset_end_time}`
    : "04:30 – 05:00 PM";

  const durations = useMemo(() => {
    if (apiSettings?.safari_durations && Array.isArray(apiSettings.safari_durations) && apiSettings.safari_durations.length > 0) {
      return apiSettings.safari_durations;
    }
    return DURATION_OPTIONS;
  }, [apiSettings?.safari_durations]);

  // Tomorrow's date formatted as YYYY-MM-DD
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0] ?? "";
  const today = new Date().toISOString().split("T")[0] ?? "";

  // 1. Date
  const [bookingDate, setBookingDate] = useState<string>(tomorrow);

  // 2. Safari Time
  const [safariTimeChoice, setSafariTimeChoice] = useState<SafariTimeOption>("sunrise");
  const [customTime, setCustomTime] = useState<string>("10:00");

  // 3. Duration
  const [duration, setDuration] = useState<SafariDuration>("2 Hours");

  // 4. Guests
  const [guests, setGuests] = useState<number>(minGuests || 2);

  // 5. Full Name
  const [fullName, setFullName] = useState<string>("");

  // 6. Country
  const [country, setCountry] = useState<string>("Sri Lanka");

  // 7. Phone
  const [phone, setPhone] = useState<string>("");

  // 8. Email
  const [email, setEmail] = useState<string>("");

  // 9. Special Request
  const [specialRequest, setSpecialRequest] = useState<string>("");

  // Availability / Slots from backend
  const [availableSlots, setAvailableSlots] = useState<DepartureSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Submission & Confirmation state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<BookingResponseData | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Frontend-only fallback: use local experience data when the API is unreachable.
  const experienceOptions = useMemo(() => {
    if (apiExperiences && apiExperiences.length > 0) return apiExperiences;
    return localExperiences.map((e, i) => ({ id: i + 1, title: e.title, slug: e.id }));
  }, [apiExperiences]);

  // Resolve active experience
  const selectedExperience = useMemo(() => {
    if (!experienceOptions || experienceOptions.length === 0) return null;
    if (preselectedExperienceId) {
      const match = experienceOptions.find(
        (e) => String(e.id) === String(preselectedExperienceId) || e.slug === String(preselectedExperienceId)
      );
      if (match) return match;
    }
    return experienceOptions[0] ?? null;
  }, [experienceOptions, preselectedExperienceId]);

  const experienceId = selectedExperience
    ? Number(selectedExperience.id)
    : experienceOptions?.[0]?.id
    ? Number(experienceOptions[0].id)
    : 110;
  const experienceTitle = selectedExperience?.title || "Bentota River Boat Safari";

  // Fetch real-time availability from backend whenever experience or date changes
  useEffect(() => {
    let isMounted = true;
    if (!open || !bookingDate || !experienceId) {
      setAvailableSlots([]);
      return;
    }

    if (!isApiConnected()) {
      setAvailableSlots([]);
      setIsLoadingSlots(false);
      return;
    }

    setIsLoadingSlots(true);
    api.getAvailability(experienceId, bookingDate)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data && Array.isArray(res.data.slots)) {
          setAvailableSlots(res.data.slots);
        } else {
          setAvailableSlots([]);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAvailableSlots([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSlots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, bookingDate, experienceId]);

  // Find slot corresponding to Sunrise (morning: start_time < 12:00, preferably 06:00-08:30)
  const sunriseSlot = useMemo(() => {
    if (!availableSlots.length) return null;
    const morningSlots = availableSlots.filter((s) => {
      const hour = parseInt(s.start_time.split(":")[0] ?? "0", 10);
      return hour >= 6 && hour <= 9;
    });
    return morningSlots[0] || availableSlots[0] || null;
  }, [availableSlots]);

  // Find slot corresponding to Sunset (afternoon/evening: start_time >= 15:30)
  const sunsetSlot = useMemo(() => {
    if (!availableSlots.length) return null;
    const eveningSlots = availableSlots.filter((s) => {
      const hour = parseInt(s.start_time.split(":")[0] ?? "0", 10);
      return hour >= 15 && hour <= 18;
    });
    return eveningSlots[eveningSlots.length - 1] || availableSlots[availableSlots.length - 1] || null;
  }, [availableSlots]);

  // Find slot corresponding to custom time if exact match exists
  const customSlot = useMemo(() => {
    if (!availableSlots.length || !customTime) return null;
    return availableSlots.find((s) => s.start_time.slice(0, 5) === customTime.slice(0, 5)) || null;
  }, [availableSlots, customTime]);

  // Active slot based on choice
  const activeSlot = useMemo(() => {
    if (safariTimeChoice === "sunrise") return sunriseSlot;
    if (safariTimeChoice === "sunset") return sunsetSlot;
    return customSlot;
  }, [safariTimeChoice, sunriseSlot, sunsetSlot, customSlot]);

  // Max capacity based on active slot and fleet limits (respecting max_guests setting)
  const maxCapacity = useMemo(() => {
    if (activeSlot) {
      return Math.max(minGuests, Math.min(activeSlot.available, maxGuestsSetting));
    }
    return maxGuestsSetting;
  }, [activeSlot, minGuests, maxGuestsSetting]);

  // Slot availability flags
  const isSunriseFull = sunriseSlot ? (sunriseSlot.available <= 0 || sunriseSlot.status !== "available") : false;
  const isSunsetFull = sunsetSlot ? (sunsetSlot.available <= 0 || sunsetSlot.status !== "available") : false;
  const isCustomFull = customSlot ? (customSlot.available <= 0 || customSlot.status !== "available") : false;

  // Keep duration valid if duration list changes
  useEffect(() => {
    if (durations.length > 0 && !durations.some((d) => d.value === duration)) {
      setDuration(durations[0]?.value || "2 Hours");
    }
  }, [durations, duration]);

  // Automatically clamp guests if active slot has fewer seats or settings changed
  useEffect(() => {
    if (activeSlot && activeSlot.available > 0 && guests > activeSlot.available) {
      setGuests(Math.max(minGuests, Math.min(activeSlot.available, maxGuestsSetting)));
    } else if (guests < minGuests) {
      setGuests(minGuests);
    } else if (guests > maxGuestsSetting) {
      setGuests(maxGuestsSetting);
    }
  }, [activeSlot, guests, minGuests, maxGuestsSetting]);

  // Reset errors and view when modal opens/closes
  useEffect(() => {
    if (open) {
      setGeneralError(null);
      setValidationErrors({});
    } else {
      setTimeout(() => {
        setBookingSuccess(null);
        setCopied(false);
      }, 300);
    }
  }, [open]);

  // Formatted safari time display string
  const resolvedSafariTimeDisplay = useMemo(() => {
    if (safariTimeChoice === "sunrise") {
      return sunriseSlot
        ? `Sunrise (${sunriseSlot.time_display.split(" - ")[0] || apiSettings?.sunrise_start_time || "07:00 AM"})`
        : `Sunrise (${apiSettings?.sunrise_start_time || "07:00 AM"})`;
    }
    if (safariTimeChoice === "sunset") {
      return sunsetSlot
        ? `Sunset (${sunsetSlot.time_display.split(" - ")[0] || apiSettings?.sunset_start_time || "04:30 PM"})`
        : `Sunset (${apiSettings?.sunset_start_time || "04:30 PM"})`;
    }
    return `${formatTimeTo12Hour(customTime)} (Preferred Time)`;
  }, [safariTimeChoice, sunriseSlot, sunsetSlot, customTime, apiSettings?.sunrise_start_time, apiSettings?.sunset_start_time]);

  // WhatsApp contact URL
  const whatsAppPhone = apiSettings?.whatsapp || "94771234567";
  const cleanPhone = whatsAppPhone.replace(/\D/g, "");
  const whatsAppSuccessUrl = bookingSuccess
    ? `https://wa.me/${cleanPhone || "94771234567"}?text=${encodeURIComponent(
        `Hello Sunset Lagoon Boat House, I have submitted a booking request for the ${
          bookingSuccess.experience?.title || experienceTitle
        }.\n\n` +
        `• Booking Reference: ${bookingSuccess.booking_reference}\n` +
        `• Date: ${bookingSuccess.booking_date}\n` +
        `• Safari Time: ${bookingSuccess.preferred_time}\n` +
        `• Duration: ${duration}\n` +
        `• Number of Guests: ${bookingSuccess.number_of_guests}\n` +
        `• Name: ${bookingSuccess.full_name}\n\n` +
        `Please confirm our safari reservation. Thank you!`
      )}`
    : null;

  const handleCopyReference = () => {
    if (bookingSuccess?.booking_reference) {
      navigator.clipboard.writeText(bookingSuccess.booking_reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    // 0. Check if booking is globally enabled
    if (!isBookingEnabled) {
      errors["booking_disabled"] = "Online bookings are currently paused. Please contact us directly.";
      setGeneralError("Online bookings are currently paused. Please contact us via WhatsApp or phone.");
      setValidationErrors(errors);
      return false;
    }

    // 1. Date validation
    if (!bookingDate) {
      errors["booking_date"] = "Please select a booking date.";
    } else if (bookingDate < today) {
      errors["booking_date"] = "Booking date cannot be in the past.";
    }

    // 2. Safari Time validation
    if (safariTimeChoice === "sunrise" && isSunriseFull) {
      errors["safari_time"] = "The Sunrise departure is fully booked on this date. Please select Sunset or Preferred Time.";
    } else if (safariTimeChoice === "sunset" && isSunsetFull) {
      errors["safari_time"] = "The Sunset departure is fully booked on this date. Please select Sunrise or Preferred Time.";
    } else if (safariTimeChoice === "preferred") {
      if (!customTime) {
        errors["safari_time"] = "Please select your preferred safari time.";
      } else if (isCustomFull) {
        errors["safari_time"] = "This departure time is fully booked. Please choose another time.";
      }
    }

    // 3. Duration validation
    if (!duration) {
      errors["duration"] = "Please select a safari duration.";
    }

    // 4. Guests validation
    if (!guests || guests < minGuests) {
      errors["number_of_guests"] = `At least ${minGuests} guest${minGuests > 1 ? "s are" : " is"} required.`;
    } else if (activeSlot && guests > activeSlot.available) {
      errors["number_of_guests"] = `Only ${activeSlot.available} seat(s) available for the selected safari time.`;
    } else if (guests > maxGuestsSetting) {
      errors["number_of_guests"] = `Maximum allowed guests per booking is ${maxGuestsSetting}.`;
    }

    // 5. Full Name validation (Required)
    if (!fullName.trim()) {
      errors["full_name"] = "Full name is required.";
    }

    // 6. Country validation (Required)
    if (!country.trim()) {
      errors["country"] = "Please select your country.";
    }

    // 7. Phone validation (Required)
    if (!phone.trim()) {
      errors["phone"] = "Phone / WhatsApp number is required.";
    }

    // 8. Email validation (Required)
    if (!email.trim()) {
      errors["email"] = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors["email"] = "Please enter a valid email address.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    const slotId = activeSlot && activeSlot.status === "available" && activeSlot.available >= guests
      ? activeSlot.id
      : null;

    const formattedSpecialRequest = specialRequest.trim()
      ? `[Requested Duration: ${duration}] ${specialRequest.trim()}`
      : `[Requested Duration: ${duration}]`;

    const payload: BookingPayload = {
      experience_id: experienceId,
      time_slot_id: slotId,
      booking_date: bookingDate,
      preferred_time: resolvedSafariTimeDisplay,
      full_name: fullName.trim(),
      gender: "prefer_not_to_say",
      country: country.trim(),
      phone: phone.trim(),
      email: email.trim(),
      number_of_guests: Number(guests),
      special_request: formattedSpecialRequest,
    };

    try {
      const response = await api.createBooking(payload);
      if (response.success && response.data) {
        setBookingSuccess(response.data);
      } else {
        setGeneralError(
          response.message || "We couldn't submit your booking request right now. Please try again."
        );
      }
    } catch (err) {
      if (!isApiConnected() || (err instanceof Error && err.message.includes("DATABASE_NOT_CONFIGURED"))) {
        // Frontend-only mode: no backend to persist to — build a local
        // confirmation so the full flow (incl. the WhatsApp handoff) still works.
        const ref = `SL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        setBookingSuccess({
          id: Date.now(),
          booking_reference: ref,
          experience_id: experienceId,
          experience: {
            id: experienceId,
            title: experienceTitle,
            slug: typeof selectedExperience?.slug === "string" ? selectedExperience.slug : "river-safari",
          },
          full_name: fullName.trim(),
          country: country.trim(),
          phone: phone.trim(),
          email: email.trim(),
          number_of_guests: Number(guests),
          booking_date: bookingDate,
          preferred_time: resolvedSafariTimeDisplay,
          special_request: formattedSpecialRequest,
          status: "pending",
        });
        return;
      }
      if (err instanceof ApiError) {
        if (err.status === 422 && err.errors) {
          const formattedErrors: Record<string, string> = {};
          Object.entries(err.errors).forEach(([field, msgs]) => {
            if (Array.isArray(msgs) && msgs.length > 0 && msgs[0]) {
              formattedErrors[field] = msgs[0];
            }
          });
          setValidationErrors(formattedErrors);
          setGeneralError("Please review the highlighted fields above.");
        } else {
          setGeneralError(
            err.message || "We couldn't submit your booking request right now. Please try again."
          );
        }
      } else {
        setGeneralError("We couldn't submit your booking request right now. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto no-scrollbar bg-background p-5 sm:p-7 md:rounded-xl">
        {bookingSuccess ? (
          /* =========================================================================
             AFTER SUCCESSFUL BOOKING: CLEAN CONFIRMATION SCREEN
             ========================================================================= */
          <div className="py-2 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-8" />
            </div>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.28em] text-accent-strong">
              Booking Request Received
            </p>
            <DialogTitle className="mt-1 font-serif text-2xl font-light tracking-tight text-foreground sm:text-3xl">
              Thank You, {bookingSuccess.full_name || fullName}
            </DialogTitle>
            <DialogDescription className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Your booking request has been received. Our team will contact you shortly to confirm your booking.
            </DialogDescription>

            {/* Booking Reference Box */}
            <div className="my-5 rounded-lg border border-accent/40 bg-sand/60 p-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Booking Reference
              </p>
              <div className="mt-1.5 flex items-center justify-center gap-3">
                <span className="font-mono text-xl font-bold tracking-wider text-foreground sm:text-2xl">
                  {bookingSuccess.booking_reference}
                </span>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-7 cursor-pointer"
                  onClick={handleCopyReference}
                  title="Copy reference"
                  aria-label="Copy booking reference"
                >
                  {copied ? (
                    <Check className="size-3.5 text-accent-strong" />
                  ) : (
                    <Copy className="size-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="mt-1 text-[11px] font-medium text-accent-strong">
                  Reference copied to clipboard!
                </p>
              )}
            </div>

            {/* Clean Confirmation Summary Grid */}
            <div className="mb-5 rounded-lg border border-border bg-card p-4 text-left">
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Experience
                  </span>
                  <p className="mt-1 font-medium text-foreground truncate" title={bookingSuccess.experience?.title || experienceTitle}>
                    {bookingSuccess.experience?.title || experienceTitle}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Date
                  </span>
                  <p className="mt-1 font-medium text-foreground">
                    {bookingSuccess.booking_date || bookingDate}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Safari Time
                  </span>
                  <p className="mt-1 font-medium text-foreground truncate">
                    {bookingSuccess.preferred_time || resolvedSafariTimeDisplay}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Duration
                  </span>
                  <p className="mt-1 font-medium text-foreground">
                    {duration}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Number of Guests
                  </span>
                  <p className="mt-1 font-medium text-foreground">
                    {bookingSuccess.number_of_guests || guests}{" "}
                    {(bookingSuccess.number_of_guests || guests) === 1 ? "Guest" : "Guests"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </span>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      <Clock className="size-3" /> Pending
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              {whatsAppSuccessUrl && (
                <Button asChild variant="gold" size="lg" className="px-6 text-xs font-semibold tracking-wider">
                  <a href={whatsAppSuccessUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-1.5 size-4" />
                    Chat on WhatsApp
                  </a>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="px-6 text-xs tracking-wider"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="px-6 text-xs tracking-wider text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setBookingSuccess(null);
                  setFullName("");
                  setPhone("");
                  setEmail("");
                  setSpecialRequest("");
                }}
              >
                Book Another Safari
              </Button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             CUSTOMER BOOKING FORM (10 FIELDS IN EXACT SPECIFIED ORDER)
             ========================================================================= */
          <>
            <DialogHeader className="pb-2 text-left">
              <div className="flex items-center gap-1.5 text-accent-strong">
                <Sailboat className="size-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.25em]">
                  Sunset Lagoon Boat House · Bentota
                </p>
              </div>
              <DialogTitle className="mt-0.5 font-serif text-2xl font-light tracking-tight text-foreground sm:text-3xl">
                Book Your Boat Safari
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Complete the request below. Our team will verify river conditions, prepare your boat, and contact you directly to confirm.
              </DialogDescription>
            </DialogHeader>

            {!isBookingEnabled && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <div>
                  <p className="font-semibold">Online Bookings Temporarily Paused</p>
                  <p className="mt-0.5">Please contact us directly via WhatsApp or phone to check current availability.</p>
                </div>
              </div>
            )}

            {generalError && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <p>{generalError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-3 space-y-4">
              {/* FIELD 1: DATE */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="booking_date" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <Calendar className="size-3.5 text-accent-strong" />
                    <span>1. Date</span>
                    <span className="text-destructive">*</span>
                  </Label>
                  {isLoadingSlots && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Loader2 className="size-3 animate-spin text-accent-strong" />
                      Checking availability...
                    </span>
                  )}
                </div>
                <Input
                  id="booking_date"
                  type="date"
                  min={today}
                  value={bookingDate}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    if (validationErrors["booking_date"]) {
                      setValidationErrors((prev) => ({ ...prev, booking_date: "" }));
                    }
                  }}
                  disabled={isSubmitting}
                  className="h-10 text-xs font-medium"
                />
                {validationErrors["booking_date"] && (
                  <p className="text-xs text-destructive">{validationErrors["booking_date"]}</p>
                )}
              </div>

              {/* FIELD 2: SAFARI TIME */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <Clock className="size-3.5 text-accent-strong" />
                  <span>2. Safari Time</span>
                  <span className="text-destructive">*</span>
                </Label>

                {/* 3 Options: Sunrise, Sunset, Preferred Time */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {/* Sunrise */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setSafariTimeChoice("sunrise");
                      if (validationErrors["safari_time"]) {
                        setValidationErrors((prev) => ({ ...prev, safari_time: "" }));
                      }
                    }}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all cursor-pointer ${
                      safariTimeChoice === "sunrise"
                        ? "border-accent-strong bg-accent/10 ring-1 ring-accent-strong text-foreground"
                        : "border-border hover:border-accent-strong/40 hover:bg-muted/15 text-muted-foreground"
                    } ${isSunriseFull ? "opacity-60 bg-muted/20" : ""}`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                        <Sun className="size-4 text-amber-500" />
                        <span>Sunrise</span>
                      </div>
                      {safariTimeChoice === "sunrise" && (
                        <Check className="size-3.5 text-accent-strong" />
                      )}
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      {sunriseLabel}
                    </span>
                    {isSunriseFull && (
                      <div className="mt-1.5">
                        <span className="inline-flex rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] font-semibold text-destructive">
                          Fully Booked
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Sunset */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setSafariTimeChoice("sunset");
                      if (validationErrors["safari_time"]) {
                        setValidationErrors((prev) => ({ ...prev, safari_time: "" }));
                      }
                    }}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all cursor-pointer ${
                      safariTimeChoice === "sunset"
                        ? "border-accent-strong bg-accent/10 ring-1 ring-accent-strong text-foreground"
                        : "border-border hover:border-accent-strong/40 hover:bg-muted/15 text-muted-foreground"
                    } ${isSunsetFull ? "opacity-60 bg-muted/20" : ""}`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                        <Sunset className="size-4 text-orange-500" />
                        <span>Sunset</span>
                      </div>
                      {safariTimeChoice === "sunset" && (
                        <Check className="size-3.5 text-accent-strong" />
                      )}
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      {sunsetLabel}
                    </span>
                    {isSunsetFull && (
                      <div className="mt-1.5">
                        <span className="inline-flex rounded bg-destructive/10 px-1.5 py-0.5 text-[9px] font-semibold text-destructive">
                          Fully Booked
                        </span>
                      </div>
                    )}
                  </button>

                  {/* Preferred Time */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setSafariTimeChoice("preferred");
                      if (validationErrors["safari_time"]) {
                        setValidationErrors((prev) => ({ ...prev, safari_time: "" }));
                      }
                    }}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all cursor-pointer ${
                      safariTimeChoice === "preferred"
                        ? "border-accent-strong bg-accent/10 ring-1 ring-accent-strong text-foreground"
                        : "border-border hover:border-accent-strong/40 hover:bg-muted/15 text-muted-foreground"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                        <Clock className="size-4 text-accent-strong" />
                        <span>Preferred Time</span>
                      </div>
                      {safariTimeChoice === "preferred" && (
                        <Check className="size-3.5 text-accent-strong" />
                      )}
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground">
                      Choose exact time
                    </span>
                    <div className="mt-1.5">
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimeTo12Hour(customTime)}
                      </span>
                    </div>
                  </button>
                </div>

                {/* If "Preferred Time" is selected, show time picker */}
                {safariTimeChoice === "preferred" && (
                  <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                    <Label htmlFor="custom_time" className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      Select Preferred Departure Time
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="custom_time"
                        type="time"
                        value={customTime}
                        onChange={(e) => {
                          setCustomTime(e.target.value);
                          if (validationErrors["safari_time"]) {
                            setValidationErrors((prev) => ({ ...prev, safari_time: "" }));
                          }
                        }}
                        disabled={isSubmitting}
                        className="h-9 w-40 text-xs font-semibold"
                      />
                      <span className="text-xs text-muted-foreground">
                        = <strong className="font-semibold text-foreground">{formatTimeTo12Hour(customTime)}</strong>
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      River safaris operate between 06:30 AM and 06:30 PM. Our team will verify boat availability for your exact time.
                    </p>
                  </div>
                )}

                {validationErrors["safari_time"] && (
                  <p className="text-xs text-destructive">{validationErrors["safari_time"]}</p>
                )}
              </div>

              {/* FIELD 3: DURATION */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                  <Clock className="size-3.5 text-accent-strong" />
                  <span>3. Duration</span>
                  <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:grid-cols-4">
                  {durations.map((opt) => {
                    const isSelected = duration === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          setDuration(opt.value);
                          if (validationErrors["duration"]) {
                            setValidationErrors((prev) => ({ ...prev, duration: "" }));
                          }
                        }}
                        className={`flex min-w-0 flex-col items-start rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-accent-strong bg-accent/10 ring-1 ring-accent-strong text-foreground font-semibold"
                            : "border-border hover:border-accent-strong/40 hover:bg-muted/15 text-muted-foreground"
                        }`}
                      >
                        <div className="flex w-full min-w-0 items-center justify-between gap-2">
                          <span className="truncate text-xs font-bold text-foreground">{opt.label}</span>
                          {isSelected && <Check className="size-3.5 shrink-0 text-accent-strong" />}
                        </div>
                        <span className="mt-0.5 w-full truncate text-[10px] text-muted-foreground">
                          {opt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {validationErrors["duration"] && (
                  <p className="text-xs text-destructive">{validationErrors["duration"]}</p>
                )}
              </div>

              {/* FIELD 4: GUESTS */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <Users className="size-3.5 text-accent-strong" />
                    <span>4. Guests</span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">
                    {activeSlot ? `Max ${maxCapacity} seat(s) available` : `Min ${minGuests} – Max ${maxGuestsSetting} passengers`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-md border border-input bg-background p-0.5 shadow-xs">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 cursor-pointer"
                      onClick={() => setGuests((g) => Math.max(minGuests, g - 1))}
                      disabled={isSubmitting || guests <= minGuests}
                      aria-label="Decrease guests"
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-12 text-center text-sm font-bold text-foreground">
                      {guests}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 cursor-pointer"
                      onClick={() => setGuests((g) => Math.min(maxCapacity, g + 1))}
                      disabled={isSubmitting || guests >= maxCapacity}
                      aria-label="Increase guests"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {guests === 1 ? "1 passenger" : `${guests} passengers`}
                  </span>
                </div>
                {validationErrors["number_of_guests"] && (
                  <p className="text-xs text-destructive">{validationErrors["number_of_guests"]}</p>
                )}
              </div>

              {/* DIVIDER FOR CUSTOMER DETAILS */}
              <div className="pt-2 border-t border-border/80">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Contact Information
                </p>
              </div>

              {/* FIELD 5: FULL NAME & FIELD 6: COUNTRY */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="full_name" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    5. Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="e.g. Eleanor Vance"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (validationErrors["full_name"]) {
                        setValidationErrors((prev) => ({ ...prev, full_name: "" }));
                      }
                    }}
                    disabled={isSubmitting}
                    className="mt-1 h-9 text-xs"
                  />
                  {validationErrors["full_name"] && (
                    <p className="mt-0.5 text-xs text-destructive">{validationErrors["full_name"]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="country" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    6. Country <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="country"
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      if (validationErrors["country"]) {
                        setValidationErrors((prev) => ({ ...prev, country: "" }));
                      }
                    }}
                    disabled={isSubmitting}
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus:border-accent-strong focus:outline-none focus:ring-1 focus:ring-accent-strong"
                  >
                    <option value="">-- Select Country --</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors["country"] && (
                    <p className="mt-0.5 text-xs text-destructive">{validationErrors["country"]}</p>
                  )}
                </div>
              </div>

              {/* FIELD 7: PHONE & FIELD 8: EMAIL */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    7. Phone / WhatsApp <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+94 77 123 4567"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (validationErrors["phone"]) {
                        setValidationErrors((prev) => ({ ...prev, phone: "" }));
                      }
                    }}
                    disabled={isSubmitting}
                    className="mt-1 h-9 text-xs"
                  />
                  {validationErrors["phone"] && (
                    <p className="mt-0.5 text-xs text-destructive">{validationErrors["phone"]}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    8. Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="eleanor@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationErrors["email"]) {
                        setValidationErrors((prev) => ({ ...prev, email: "" }));
                      }
                    }}
                    disabled={isSubmitting}
                    className="mt-1 h-9 text-xs"
                  />
                  {validationErrors["email"] && (
                    <p className="mt-0.5 text-xs text-destructive">{validationErrors["email"]}</p>
                  )}
                </div>
              </div>

              {/* FIELD 9: SPECIAL REQUEST (TEXTAREA) */}
              <div>
                <Label htmlFor="special_request" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  9. Special Request <span className="text-[10px] normal-case text-muted-foreground">(Optional)</span>
                </Label>
                <textarea
                  id="special_request"
                  rows={3}
                  placeholder="Optional: Any special requirements, hotel pickup in Bentota, birdwatching interests, accessibility needs..."
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1 flex w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground shadow-xs focus:border-accent-strong focus:outline-none focus:ring-1 focus:ring-accent-strong"
                />
              </div>

              {/* TRUST ROW & FIELD 10: REQUEST BOOKING BUTTON */}
              <div className="pt-3 border-t border-border/80 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="size-3.5 text-accent-strong" /> Free cancellation {cancellationNoticeHours}h
                  </span>
                  <span>•</span>
                  <span>No online payment required</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                    className="h-9 text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="forest"
                    size="sm"
                    disabled={isSubmitting || !isBookingEnabled}
                    className="h-9 min-w-36 text-xs font-semibold tracking-wider cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        Submitting...
                      </>
                    ) : !isBookingEnabled ? (
                      "Bookings Paused"
                    ) : (
                      "Request Booking"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
