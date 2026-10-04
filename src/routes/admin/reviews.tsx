import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  MessageSquareQuote,
  Star,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Image as ImageIcon,
  X,
  Loader2,
  Globe,
  Calendar,
  Sparkles,
  ChevronRight,
  Filter,
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
import { adminAuth, type AdminUser } from "@/services/adminAuth";
import {
  reviewApi,
  type ReviewItem,
  type ReviewStats,
} from "@/services/reviewApi";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({
    meta: [
      { title: "Customer Reviews Moderation | Sunset Lagoon Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReviewsPage,
});

function StarRating({
  rating,
  interactive = false,
  onChange,
  size = "sm",
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (val: number) => void;
  size?: "sm" | "md" | "lg";
}) {
  const iconSize = size === "lg" ? "size-6" : size === "md" ? "size-4" : "size-3.5";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange && onChange(star)}
          className={`${interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}`}
        >
          <Star
            className={`${iconSize} ${
              star <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewsPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Reviews Data
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    pending: 0,
    approved: 0,
    hidden: 0,
    average_rating: 5.0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; review: ReviewItem } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Add Review Form State
  const [addName, setAddName] = useState("");
  const [addCountry, setAddCountry] = useState("");
  const [addRating, setAddRating] = useState(5);
  const [addReviewText, setAddReviewText] = useState("");
  const [addStatus, setAddStatus] = useState<"pending" | "approved" | "hidden">("approved");
  const [addSource, setAddSource] = useState<"website" | "google">("website");
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth check
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      if (!adminAuth.isAuthenticated()) {
        navigate({ to: "/admin/login" });
        return;
      }
      try {
        const user = await adminAuth.getMe();
        if (isMounted) {
          setAdmin(user);
          setAuthLoading(false);
        }
      } catch {
        if (isMounted) navigate({ to: "/admin/login" });
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Fetch reviews from API
  const fetchReviews = useCallback(async () => {    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await reviewApi.getAdminReviews({
        status: statusFilter,
        rating: ratingFilter,
        search: searchQuery,
      });

      if (response.success) {
        setReviews(response.data || []);
        if (response.stats) {
          setStats(response.stats);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load customer reviews.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, ratingFilter, searchQuery]);

  const [syncing, setSyncing] = useState(false);

  // Pull the latest Google reviews into the site
  const handleSyncGoogle = async () => {
    setSyncing(true);
    setErrorMessage(null);
    try {
      const res = await reviewApi.syncFromGoogle();
      setSuccessMessage(res.message || `Synced ${res.imported} review(s) from Google.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sync failed.";
      setErrorMessage(msg);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && admin) {
      fetchReviews();
    }
  }, [authLoading, admin, fetchReviews]);

  // Action: Approve review
  const handleApprove = async (review: ReviewItem) => {
    setActionLoading(true);
    try {
      const res = await reviewApi.approveReview(review.id);
      setSuccessMessage(res.message || `Review from ${review.customer_name} approved and live on website!`);
      setTimeout(() => setSuccessMessage(null), 3500);
      fetchReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve review.";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Hide review
  const handleHide = async (review: ReviewItem) => {
    setActionLoading(true);
    try {
      const res = await reviewApi.hideReview(review.id);
      setSuccessMessage(res.message || `Review from ${review.customer_name} is now hidden.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      fetchReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to hide review.";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Delete review
  const handleDeleteConfirm = async () => {
    if (!deletingReview) return;
    setActionLoading(true);
    try {
      await reviewApi.deleteReview(deletingReview.id);
      setSuccessMessage(`Review from ${deletingReview.customer_name} was deleted permanently.`);
      setTimeout(() => setSuccessMessage(null), 3500);
      setDeletingReview(null);
      fetchReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete review.";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Create Review Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) {
      setErrorMessage("Customer name is required.");
      return;
    }
    if (!addReviewText.trim()) {
      setErrorMessage("Review text is required.");
      return;
    }

    setActionLoading(true);
    const formData = new FormData();
    formData.append("customer_name", addName.trim());
    if (addCountry.trim()) formData.append("country", addCountry.trim());
    formData.append("rating", String(addRating));
    formData.append("review", addReviewText.trim());
    formData.append("status", addStatus);
    formData.append("source", addSource);
    if (addImageFile) formData.append("image", addImageFile);

    try {
      await reviewApi.createReview(formData);
      setSuccessMessage("New customer review added successfully!");
      setTimeout(() => setSuccessMessage(null), 3500);
      setShowAddModal(false);
      // Reset form
      setAddName("");
      setAddCountry("");
      setAddRating(5);
      setAddReviewText("");
      setAddStatus("approved");
      setAddSource("website");
      setAddImageFile(null);
      setAddImagePreview(null);
      fetchReviews();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create review.";
      setErrorMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAddImageFile(file);
      const url = URL.createObjectURL(file);
      setAddImagePreview(url);
    } else {
      setAddImageFile(null);
      setAddImagePreview(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-accent-strong" />
      </div>
    );
  }

  return (
    <AdminLayout
      admin={admin}
      pageTitle="Customer Reviews"
      badgeCounts={{ reviews: stats.pending }}
    >
      <div className="space-y-6">
        {/* Notifications */}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Header Banner & Live Metrics */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-accent-strong">
                <MessageSquareQuote className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                  Guest Feedback & Reputation
                </span>
              </div>
              <h1 className="mt-1 font-serif text-2xl font-light tracking-tight text-foreground sm:text-3xl">
                Customer Reviews Moderation
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Moderate incoming customer reviews, publish authentic testimonials to the website, and manage guest experiences.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="forest"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="h-9 gap-1.5 text-xs font-semibold tracking-wider cursor-pointer"
              >
                <Plus className="size-3.5" />
                + Add Review
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSyncGoogle}
                disabled={syncing || loading}
                title="Pull the latest Google reviews into the site"
                className="h-9 gap-1.5 text-xs font-semibold tracking-wider cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Google"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={fetchReviews}
                disabled={loading}
                title="Refresh reviews"
                className="size-9 cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <div className="rounded-lg border border-border bg-muted/20 p-2.5 text-center">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Reviews</span>
              <p className="mt-0.5 text-base font-bold text-foreground">{stats.total}</p>
            </div>
            <div
              onClick={() => setStatusFilter("pending")}
              className={`rounded-lg border p-2.5 text-center cursor-pointer transition-colors ${
                statusFilter === "pending"
                  ? "border-amber-500 bg-amber-500/15"
                  : "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold flex items-center justify-center gap-1">
                Pending Approval
              </span>
              <p className="mt-0.5 text-base font-bold text-amber-800 dark:text-amber-300">{stats.pending}</p>
            </div>
            <div
              onClick={() => setStatusFilter("approved")}
              className={`rounded-lg border p-2.5 text-center cursor-pointer transition-colors ${
                statusFilter === "approved"
                  ? "border-emerald-500 bg-emerald-500/15"
                  : "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                Live (Approved)
              </span>
              <p className="mt-0.5 text-base font-bold text-emerald-700 dark:text-emerald-400">{stats.approved}</p>
            </div>
            <div
              onClick={() => setStatusFilter("hidden")}
              className={`rounded-lg border p-2.5 text-center cursor-pointer transition-colors ${
                statusFilter === "hidden"
                  ? "border-neutral-500 bg-neutral-500/15"
                  : "border-border bg-muted/20 hover:bg-muted/30"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Hidden</span>
              <p className="mt-0.5 text-base font-bold text-foreground">{stats.hidden}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 rounded-lg border border-amber-400/30 bg-amber-400/5 p-2.5 text-center">
              <span className="text-[10px] uppercase tracking-wider text-amber-800 dark:text-amber-300 font-semibold flex items-center justify-center gap-1">
                <Star className="size-3 fill-amber-400 text-amber-400" /> Avg Rating
              </span>
              <p className="mt-0.5 text-base font-bold text-foreground">
                {stats.average_rating} <span className="text-[11px] font-normal text-muted-foreground">/ 5</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by customer name, country, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          {/* Status Tabs & Rating Selector */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Tabs */}
            <div className="inline-flex rounded-md border border-input bg-background p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-accent-strong text-white font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`rounded px-2.5 py-1 font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  statusFilter === "pending"
                    ? "bg-amber-600 text-white font-semibold shadow-xs"
                    : "text-amber-700 dark:text-amber-400 hover:text-amber-800"
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("approved")}
                className={`rounded px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  statusFilter === "approved"
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "text-emerald-700 dark:text-emerald-400 hover:text-emerald-800"
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("hidden")}
                className={`rounded px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  statusFilter === "hidden"
                    ? "bg-neutral-800 text-white font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Hidden ({stats.hidden})
              </button>
            </div>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-strong"
            >
              <option value="all">All Ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
              <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
              <option value="3">⭐⭐⭐ (3 Stars)</option>
              <option value="2">⭐⭐ (2 Stars)</option>
              <option value="1">⭐ (1 Star)</option>
            </select>
          </div>
        </div>

        {/* Reviews Cards List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-accent-strong" />
            <p className="mt-3 text-xs font-medium">Loading customer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 px-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MessageSquareQuote className="size-6" />
            </div>
            <h3 className="mt-3 font-serif text-lg font-medium text-foreground">No reviews found</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              {searchQuery || statusFilter !== "all" || ratingFilter !== "all"
                ? "No reviews match your selected filter criteria. Try clearing the search or status filter."
                : "No customer reviews have been submitted yet. You can manually record guestbook feedback."}
            </p>
            <div className="mt-5">
              <Button
                type="button"
                variant="forest"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="text-xs"
              >
                + Add First Review
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => {
              const isPending = review.status === "pending";
              const isApproved = review.status === "approved";
              const isHidden = review.status === "hidden";
              const hasImage = Boolean(review.image_url || review.image);
              const imageUrl = review.image_url || review.image || "";

              return (
                <div
                  key={review.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-5 shadow-xs transition-all hover:shadow-md ${
                    isPending
                      ? "border-amber-400/80 bg-amber-50/20 dark:bg-amber-950/10 ring-1 ring-amber-400/30"
                      : isApproved
                      ? "border-border hover:border-emerald-500/40"
                      : "border-border/60 bg-muted/10 opacity-75"
                  }`}
                >
                  <div>
                    {/* Top Row: Customer Info & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-sm text-foreground">
                          {review.customer_name}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {review.country ? (
                            <span className="flex items-center gap-1">
                              <Globe className="size-3 text-accent-strong" />
                              {review.country}
                            </span>
                          ) : (
                            <span className="italic text-muted-foreground/60">Guest</span>
                          )}
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {review.created_at_date || review.created_at?.split(" ")[0] || "Recent"}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          isPending
                            ? "border border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300 animate-pulse"
                            : isApproved
                            ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "border border-border bg-neutral-800/20 text-muted-foreground"
                        }`}
                      >
                        {isPending ? (
                          <>
                            <AlertCircle className="size-2.5" /> Needs Approval
                          </>
                        ) : isApproved ? (
                          <>
                            <Eye className="size-2.5" /> Live on Website
                          </>
                        ) : (
                          <>
                            <EyeOff className="size-2.5" /> Hidden
                          </>
                        )}
                      </span>
                    </div>

                    {/* Star Rating */}
                    <div className="mt-3 flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs font-semibold text-foreground">
                        {review.rating}.0
                      </span>
                    </div>

                    {/* Review Body */}
                    <div className="mt-3">
                      <p className="text-xs leading-relaxed text-foreground/90 italic">
                        "{review.review}"
                      </p>
                    </div>

                    {/* Attached Photo Thumbnail (if available) */}
                    {hasImage && (
                      <div className="mt-3.5">
                        <div
                          onClick={() =>
                            setPreviewImage({
                              url: imageUrl,
                              title: `${review.customer_name}'s Safari Photo`,
                              review,
                            })
                          }
                          className="group/img relative flex h-24 w-36 overflow-hidden rounded-lg border border-border bg-muted cursor-pointer shadow-xs transition-transform hover:scale-[1.02]"
                        >
                          <img
                            src={imageUrl}
                            alt={`${review.customer_name}'s review photo`}
                            className="size-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/img:opacity-100">
                            <span className="flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                              <ImageIcon className="size-3" /> View Photo
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-5 flex items-center justify-between border-t border-border/80 pt-3">
                    <div className="flex items-center gap-1.5">
                      {isPending && (
                        <>
                          <Button
                            type="button"
                            variant="forest"
                            size="sm"
                            onClick={() => handleApprove(review)}
                            disabled={actionLoading}
                            className="h-7 gap-1 px-2.5 text-[11px] font-semibold cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="size-3" />
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleHide(review)}
                            disabled={actionLoading}
                            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <EyeOff className="mr-1 size-3" />
                            Hide
                          </Button>
                        </>
                      )}

                      {isApproved && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleHide(review)}
                          disabled={actionLoading}
                          title="Hide from public website"
                          className="h-7 px-2.5 text-[11px] text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer"
                        >
                          <EyeOff className="mr-1 size-3" />
                          Hide from Website
                        </Button>
                      )}

                      {isHidden && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(review)}
                          disabled={actionLoading}
                          title="Restore to public website"
                          className="h-7 px-2.5 text-[11px] text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 cursor-pointer"
                        >
                          <Eye className="mr-1 size-3" />
                          Publish to Website
                        </Button>
                      )}
                    </div>

                    {/* Delete Action */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingReview(review)}
                      disabled={actionLoading}
                      title="Delete review"
                      className="size-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Lightbox / Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            onClick={() => setPreviewImage(null)}
          >
            <Button
              variant="heroOutline"
              size="icon"
              className="absolute right-5 top-5 cursor-pointer text-white"
              onClick={() => setPreviewImage(null)}
            >
              <X className="size-5" />
            </Button>

            <div
              className="flex max-h-[90vh] max-w-3xl flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl"
              />

              <div className="mt-4 text-center text-white space-y-1">
                <h3 className="text-base font-semibold">{previewImage.review.customer_name}</h3>
                <p className="text-xs text-white/75 flex items-center justify-center gap-1.5">
                  {previewImage.review.country && (
                    <span>{previewImage.review.country} · </span>
                  )}
                  <span>Rating: {previewImage.review.rating}/5 · </span>
                  <span className="capitalize">{previewImage.review.status}</span>
                </p>
                <p className="text-xs italic text-white/80 max-w-md mx-auto">
                  "{previewImage.review.review}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Dialog open={Boolean(deletingReview)} onOpenChange={(open) => !open && setDeletingReview(null)}>
          <DialogContent className="w-full max-w-md bg-background p-5 sm:p-6">
            <DialogHeader className="text-left">
              <div className="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <Trash2 className="size-5" />
              </div>
              <DialogTitle className="mt-2 font-serif text-xl font-light text-foreground">
                Delete Customer Review?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to permanently delete the review from{" "}
                <strong className="text-foreground">{deletingReview?.customer_name}</strong>?
                This action cannot be undone and any attached photo will also be removed.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingReview(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="text-xs cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete Permanently"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Review Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-h-[92vh] w-full max-w-lg overflow-y-auto bg-background p-5 sm:p-6">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-1.5 text-accent-strong">
                <MessageSquareQuote className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Guest Feedback
                </span>
              </div>
              <DialogTitle className="font-serif text-xl font-light text-foreground">
                Add Customer Review
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Record feedback from your guestbook, WhatsApp, or direct visitor testimonials.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddSubmit} className="mt-3 space-y-4">
              {/* Customer Name */}
              <div>
                <Label htmlFor="rev_name" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Customer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rev_name"
                  placeholder="e.g. Sarah Jenkins"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                  className="mt-1 h-9 text-xs"
                />
              </div>

              {/* Country */}
              <div>
                <Label htmlFor="rev_country" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Country <span className="text-[10px] font-normal normal-case text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="rev_country"
                  placeholder="e.g. United Kingdom"
                  value={addCountry}
                  onChange={(e) => setAddCountry(e.target.value)}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              {/* Rating */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Rating <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5 flex items-center gap-3">
                  <StarRating
                    rating={addRating}
                    interactive={true}
                    onChange={(val) => setAddRating(val)}
                    size="md"
                  />
                  <span className="text-xs font-semibold text-foreground">
                    {addRating} Stars
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <Label htmlFor="rev_text" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Review Comment <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="rev_text"
                  rows={3}
                  placeholder="Customer's comments about their safari experience..."
                  value={addReviewText}
                  onChange={(e) => setAddReviewText(e.target.value)}
                  required
                  className="mt-1 flex w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-strong"
                />
              </div>

              {/* Review Source */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Source
                </Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddSource("website")}
                    className={`rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      addSource === "website"
                        ? "border-accent-strong bg-accent/10 text-foreground font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span>Website</span>
                    <span className="block text-[10px] text-muted-foreground">Direct entry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddSource("google")}
                    className={`rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      addSource === "google"
                        ? "border-accent-strong bg-accent/10 text-foreground font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span>Google</span>
                    <span className="block text-[10px] text-muted-foreground">Copied from Google</span>
                  </button>
                </div>
              </div>

              {/* Initial Status */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Status
                </Label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddStatus("approved")}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      addStatus === "approved"
                        ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span>Approved</span>
                    <span className="text-[10px] text-muted-foreground">Publish Live</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddStatus("pending")}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      addStatus === "pending"
                        ? "border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span>Pending</span>
                    <span className="text-[10px] text-muted-foreground">Draft Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddStatus("hidden")}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      addStatus === "hidden"
                        ? "border-neutral-600 bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span>Hidden</span>
                    <span className="text-[10px] text-muted-foreground">Private</span>
                  </button>
                </div>
              </div>

              {/* Optional Photo Attachment */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Customer Photo <span className="text-[10px] font-normal normal-case text-muted-foreground">(Optional)</span>
                </Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-4 text-center cursor-pointer transition-colors hover:border-accent-strong/50 hover:bg-muted/20"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  {addImagePreview ? (
                    <div className="space-y-1.5">
                      <img
                        src={addImagePreview}
                        alt="Preview"
                        className="mx-auto max-h-32 rounded object-contain"
                      />
                      <p className="text-[11px] text-accent-strong">Tap to change photo</p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-muted-foreground">
                      <ImageIcon className="mx-auto size-5 text-accent-strong" />
                      <p className="text-xs font-medium text-foreground">Select safari photo</p>
                      <p className="text-[10px]">JPG, PNG, WEBP up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="forest"
                  size="sm"
                  disabled={actionLoading}
                  className="min-w-28 text-xs font-semibold tracking-wider cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Review"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
