import { useState } from "react";
import { Camera, CheckCircle2, Loader2, Send, Star } from "lucide-react";
import { useReviews } from "@/hooks/useApiData";
import { GOOGLE_MAPS_URL } from "@/data/siteConfig";
import { reviewApi } from "@/services/reviewApi";
import { uploadToCloudinary } from "@/services/uploads";
import { Reveal } from "./Reveal";

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} ${i < value ? "fill-accent text-accent" : "text-border"}`}
        />
      ))}
    </span>
  );
}

function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="inline-flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            aria-label={`${v} star${v > 1 ? "s" : ""}`}
            onClick={() => onChange(v)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className={`size-7 ${v <= value ? "fill-accent text-accent" : "text-border"}`} />
          </button>
        );
      })}
    </span>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground/60 focus:border-accent-strong focus:outline-none focus:ring-1 focus:ring-accent-strong";

export function ReviewsSection() {
  const { data: reviews } = useReviews();
  const approved = reviews ?? [];

  const [ref, setRef] = useState("");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!ref.trim()) {
      setError("Please enter your booking reference (e.g. SL-XXXXXX).");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!text.trim()) {
      setError("Please write a few words about your experience.");
      return;
    }
    setLoading(true);
    try {
      let image: string | null = null;
      if (photo) {
        const uploaded = await uploadToCloudinary(photo);
        image = uploaded.url;
      }
      const res = await reviewApi.submitCustomerReview({
        booking_reference: ref.trim(),
        name: name.trim(),
        rating,
        review: text.trim(),
        image,
      });
      setSuccess(res.message);
      setRef("");
      setName("");
      setRating(5);
      setText("");
      setPhoto(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="reviews" className="section-pad scroll-mt-20 bg-background">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.28em] text-accent-strong">
            Guest stories
          </p>
          <h2 className="font-serif text-4xl font-light leading-[1.06] tracking-tight sm:text-5xl">
            What Guests Say
          </h2>
          <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground">
            Every review below is from a verified safari guest — each one is matched to a real
            booking before it appears here.
          </p>

          <div className="mt-10 space-y-5">
            {approved.length === 0 ? (
              <Reveal>
                <div className="rounded-xl border border-dashed border-border p-8 text-center">
                  <Stars value={5} />
                  <p className="mt-3 font-serif text-xl font-light">Be the first to share your journey</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Recently cruised with us? Tell fellow travellers how it was.
                  </p>
                </div>
              </Reveal>
            ) : (
              approved.slice(0, 6).map((r, i) => (
                <Reveal key={r.id} delay={Math.min(i, 3) * 0.08}>
                  <figure className="rounded-xl border border-border bg-card p-6">
                    <Stars value={r.rating} />
                    <blockquote className="mt-3 text-[15px] leading-7 text-foreground">
                      “{r.review}”
                    </blockquote>
                    <figcaption className="mt-4 flex items-center gap-3">
                      {r.image ? (
                        <img src={r.image} alt="" loading="lazy" className="size-10 rounded-full object-cover" />
                      ) : (
                        <span className="grid size-10 place-items-center rounded-full bg-primary font-serif text-lg text-primary-foreground">
                          {(r.customer_name || "G").charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span>
                        <span className="block text-sm font-semibold">
                          {r.customer_name}
                          {r.source === "google" && (
                            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              via Google
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {[r.country, r.created_at ? new Date(r.created_at).getFullYear() : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))
            )}
            {approved.some((r) => r.source === "google") && (
              <p className="text-xs text-muted-foreground">
                Some reviews collected from Google —{" "}
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent-strong hover:underline"
                >
                  review us on Google
                </a>
                .
              </p>
            )}
          </div>
        </div>

        <div className="lg:pt-[104px]">
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 lg:sticky lg:top-28">
              {success ? (
                <div className="py-8 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
                    <CheckCircle2 className="size-7" />
                  </span>
                  <h3 className="mt-4 font-serif text-2xl font-light">Review received</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-muted-foreground">{success}</p>
                  <button
                    type="button"
                    onClick={() => setSuccess(null)}
                    className="mt-6 text-xs font-bold uppercase tracking-widest text-accent-strong hover:underline"
                  >
                    Write another review
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h3 className="font-serif text-2xl font-light tracking-tight">Share your experience</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    For verified guests only — your booking reference confirms your safari with us.
                  </p>

                  {error && (
                    <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                      {error}
                    </p>
                  )}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="review-ref" className="text-[11px] font-bold uppercase tracking-widest">
                        Booking ref *
                      </label>
                      <input
                        id="review-ref"
                        value={ref}
                        onChange={(e) => setRef(e.target.value.toUpperCase())}
                        placeholder="SL-XXXXXX"
                        autoComplete="off"
                        className={`${inputClass} font-mono uppercase`}
                      />
                    </div>
                    <div>
                      <label htmlFor="review-name" className="text-[11px] font-bold uppercase tracking-widest">
                        Your name *
                      </label>
                      <input
                        id="review-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sarah J."
                        autoComplete="name"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-[11px] font-bold uppercase tracking-widest">Your rating *</span>
                    <div className="mt-2">
                      <RatingInput value={rating} onChange={setRating} />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="review-text" className="text-[11px] font-bold uppercase tracking-widest">
                      Your review *
                    </label>
                    <textarea
                      id="review-text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="How was the river, the wildlife, the crew...?"
                      className={`${inputClass} resize-y`}
                    />
                  </div>

                  <div className="mt-4">
                    <label htmlFor="review-photo" className="text-[11px] font-bold uppercase tracking-widest">
                      Photo <span className="font-medium normal-case text-muted-foreground">(optional)</span>
                    </label>
                    <label
                      htmlFor="review-photo"
                      className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input bg-background px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-accent-strong"
                    >
                      <Camera className="size-4 shrink-0" />
                      <span className="truncate">{photo ? photo.name : "Add a photo from your safari..."}</span>
                    </label>
                    <input
                      id="review-photo"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="size-3.5" /> <span>Submit Review</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
