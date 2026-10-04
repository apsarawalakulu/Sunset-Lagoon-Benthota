import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Upload,
  Video,
  X,
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
import { mediaApi, type MediaItem, type MediaStats } from "@/services/mediaApi";

const CATEGORY_PRESETS = [
  "Boats & Lagoon",
  "Wildlife",
  "Mangroves",
  "Sunset",
  "General",
] as const;

function getLocationBadgeText(location?: string) {
  switch (location) {
    case "hero":
      return "Hero Only";
    case "both":
      return "Gallery + Hero";
    case "about":
      return "About Section";
    case "story":
      return "Story Banner";
    case "wildlife":
      return "Wildlife Section";
    case "experience_1":
      return "Exp 1: River Safari";
    case "experience_2":
      return "Exp 2: Mangroves";
    case "experience_3":
      return "Exp 3: Wildlife";
    case "gallery":
    default:
      return "Gallery Only";
  }
}

function getLocationBadgeClass(location?: string) {
  switch (location) {
    case "hero":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30";
    case "both":
      return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30";
    case "about":
      return "bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30";
    case "story":
      return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30";
    case "wildlife":
      return "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30";
    case "experience_1":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30";
    case "experience_2":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30";
    case "experience_3":
      return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30";
    case "gallery":
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}

export function MediaManager() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<MediaStats>({
    total: 0,
    images: 0,
    videos: 0,
    visible: 0,
    hidden: 0,
    categories: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden">("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [heroFilter, setHeroFilter] = useState<"all" | "heroes" | "non_heroes">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
  const [uploadType, setUploadType] = useState<"image" | "video">("image");
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);

  // Active selected item for edit/delete/preview
  const [activeItem, setActiveItem] = useState<MediaItem | null>(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>("");
  const [uploadCategory, setUploadCategory] = useState<string>("General");
  const [uploadDescription, setUploadDescription] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<"visible" | "hidden">("visible");
  const [uploadLocation, setUploadLocation] = useState<string>("gallery");
  const [uploadIsHero, setUploadIsHero] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadFormError, setUploadFormError] = useState<string | null>(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("General");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editStatus, setEditStatus] = useState<"visible" | "hidden">("visible");
  const [editLocation, setEditLocation] = useState<string>("gallery");
  const [editIsHero, setEditIsHero] = useState<boolean>(false);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Delete State
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Quick Copy Feedback State
  const [copiedId, setCopiedId] = useState<number | string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Media List
  const fetchMedia = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await mediaApi.getAdminMedia({
        type: typeFilter,
        category: categoryFilter,
        status: statusFilter,
        display_location: locationFilter !== "all" ? locationFilter : undefined,
        is_hero: heroFilter === "heroes" ? "1" : heroFilter === "non_heroes" ? "0" : undefined,
        search: searchQuery,
      });

      if (response.success && Array.isArray(response.data)) {
        setItems(response.data);
        if (response.stats) {
          setStats(response.stats);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load media items.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [typeFilter, categoryFilter, statusFilter, locationFilter, heroFilter, searchQuery]);

  // Handle Image/Video File Selection for Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadFormError(null);

    if (!file) {
      setUploadFile(null);
      setUploadPreviewUrl(null);
      return;
    }

    if (uploadType === "image") {
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        setUploadFormError("Please select a valid image file (JPG, JPEG, PNG, WEBP).");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setUploadFormError("Image file size must be less than 15MB.");
        return;
      }
    } else {
      const validTypes = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-m4v",
        "video/ogg",
        "video/3gpp",
      ];
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const validExts = ["mp4", "webm", "mov", "m4v", "qt", "ogv"];
      const isVideoMime = file.type.startsWith("video/") || validTypes.includes(file.type);
      const isVideoExt = validExts.includes(ext);

      if (!isVideoMime && !isVideoExt) {
        setUploadFormError("Please select a valid video file (MP4, WEBM, MOV, M4V).");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setUploadFormError("Video file size must be less than 100MB.");
        return;
      }
    }

    setUploadFile(file);
    const objectUrl = URL.createObjectURL(file);
    setUploadPreviewUrl(objectUrl);

    // Auto-populate Title if empty from filename
    if (!uploadTitle.trim()) {
      const rawName = file.name.replace(/\.[^/.]+$/, "");
      const cleanTitle = rawName
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setUploadTitle(cleanTitle);
    }
  };

  // Open Upload Modal
  const openUploadModal = (type: "image" | "video") => {
    setUploadType(type);
    setUploadFile(null);
    setUploadPreviewUrl(null);
    setUploadTitle("");
    setUploadCategory("General");
    setUploadDescription("");
    setUploadStatus("visible");
    setUploadLocation("gallery");
    setUploadIsHero(false);
    setUploadProgress(0);
    setUploadFormError(null);
    setUploadModalOpen(true);
  };

  // Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadFormError(null);

    if (!uploadFile) {
      setUploadFormError("Please select a file to upload.");
      return;
    }

    if (!uploadTitle.trim()) {
      setUploadFormError("Please enter a title for this media item.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("type", uploadType);
    formData.append("title", uploadTitle.trim());
    formData.append("category", uploadCategory);
    formData.append("description", uploadDescription.trim());
    formData.append("status", uploadStatus);
    formData.append("is_visible", uploadStatus === "visible" ? "1" : "0");
    const isHeroEligible = uploadLocation === "hero" || uploadLocation === "both";
    formData.append("display_location", uploadLocation);
    formData.append("is_hero", isHeroEligible && uploadIsHero ? "1" : "0");

    try {
      await mediaApi.uploadMedia(formData, (percent) => {
        setUploadProgress(percent);
      });

      setSuccessMessage(`${uploadType === "image" ? "Photo" : "Video"} uploaded and saved successfully!`);
      setTimeout(() => setSuccessMessage(null), 4000);

      setUploadModalOpen(false);
      fetchMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed. Please try again.";
      setUploadFormError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (item: MediaItem) => {
    setActiveItem(item);
    setEditTitle(item.title);
    setEditCategory(item.category || "General");
    setEditDescription(item.description || "");
    setEditStatus(item.status);
    setEditLocation(item.display_location || "gallery");
    setEditIsHero(item.is_hero || false);
    setEditFile(null);
    setEditFormError(null);
    setEditModalOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    if (!editTitle.trim()) {
      setEditFormError("Title is required.");
      return;
    }

    setIsSavingEdit(true);
    setEditFormError(null);

    const formData = new FormData();
    formData.append("title", editTitle.trim());
    formData.append("category", editCategory);
    formData.append("description", editDescription.trim());
    formData.append("status", editStatus);
    formData.append("is_visible", editStatus === "visible" ? "1" : "0");
    const isEditHeroEligible = editLocation === "hero" || editLocation === "both";
    formData.append("display_location", editLocation);
    formData.append("is_hero", isEditHeroEligible && editIsHero ? "1" : "0");

    if (editFile) {
      formData.append("file", editFile);
    }

    try {
      await mediaApi.updateMedia(activeItem.id, formData);
      setSuccessMessage("Media updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      setEditModalOpen(false);
      fetchMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update media.";
      setEditFormError(msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Quick Toggle / Set Hero Media
  const handleToggleHero = async (item: MediaItem) => {
    try {
      const targetState = !item.is_hero;
      const res = await mediaApi.setHeroMedia(item.id, targetState);
      setSuccessMessage(
        res.message ||
          (targetState
            ? `"${item.title}" is now the active website Hero!`
            : "Hero media removed. Website will use default hero slideshow.")
      );
      setTimeout(() => setSuccessMessage(null), 3500);
      fetchMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update Hero status.";
      setErrorMessage(msg);
    }
  };

  // Quick Toggle Visibility
  const handleToggleVisibility = async (item: MediaItem) => {
    try {
      const res = await mediaApi.toggleVisibility(item.id);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? res.data : i))
      );
      // Update quick stats
      setStats((prev) => {
        const isNowVisible = res.data.status === "visible";
        return {
          ...prev,
          visible: isNowVisible ? prev.visible + 1 : Math.max(0, prev.visible - 1),
          hidden: !isNowVisible ? prev.hidden + 1 : Math.max(0, prev.hidden - 1),
        };
      });
      setSuccessMessage(res.message || "Visibility updated.");
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle visibility.";
      setErrorMessage(msg);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (item: MediaItem) => {
    setActiveItem(item);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    if (!activeItem) return;

    setIsDeleting(true);
    try {
      await mediaApi.deleteMedia(activeItem.id);
      setSuccessMessage("Media item and server file deleted permanently.");
      setTimeout(() => setSuccessMessage(null), 3000);
      setDeleteModalOpen(false);
      fetchMedia();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete media.";
      setErrorMessage(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy public URL
  const handleCopyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Category list combined from presets and database categories
  const allCategories = useMemo(() => {
    const list = new Set<string>(CATEGORY_PRESETS);
    if (stats.categories) {
      stats.categories.forEach((c) => list.add(c));
    }
    return Array.from(list);
  }, [stats.categories]);

  return (
    <div className="space-y-6">
      {/* Top Notification Alerts */}
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

      {/* Header Banner with Metrics & Quick Upload Actions */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-accent-strong">
              <Film className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em]">
                Local Server Storage
              </span>
            </div>
            <h1 className="mt-1 font-serif text-2xl font-light tracking-tight text-foreground sm:text-3xl">
              Website Media & Gallery
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage website photos and videos directly from your PC or mobile phone. Only visible items appear on the website.
            </p>
          </div>

          {/* Action Buttons (Mobile friendly) */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="forest"
              size="sm"
              onClick={() => openUploadModal("image")}
              className="h-9 gap-1.5 text-xs font-semibold tracking-wider cursor-pointer"
            >
              <ImageIcon className="size-3.5" />
              + Upload Photo
            </Button>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={() => openUploadModal("video")}
              className="h-9 gap-1.5 text-xs font-semibold tracking-wider cursor-pointer"
            >
              <Video className="size-3.5" />
              + Upload Video
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={fetchMedia}
              disabled={isLoading}
              title="Refresh media"
              className="size-9 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-6">
          <div className="rounded-lg border border-border bg-muted/20 p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Media</span>
            <p className="mt-0.5 text-base font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Photos</span>
            <p className="mt-0.5 text-base font-bold text-foreground">{stats.images}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Videos</span>
            <p className="mt-0.5 text-base font-bold text-foreground">{stats.videos}</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold flex items-center justify-center gap-1">
              <Star className="size-2.5 fill-amber-500 text-amber-500" /> Active Hero
            </span>
            <p className="mt-0.5 text-base font-bold text-amber-800 dark:text-amber-300">
              {stats.heroes !== undefined ? stats.heroes : items.filter((i) => i.is_hero).length}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Live (Visible)</span>
            <p className="mt-0.5 text-base font-bold text-emerald-700 dark:text-emerald-400">{stats.visible}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Hidden</span>
            <p className="mt-0.5 text-base font-bold text-amber-700 dark:text-amber-400">{stats.hidden}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title, category, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type Filter */}
          <div className="inline-flex rounded-md border border-input bg-background p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setTypeFilter("all")}
              className={`rounded px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                typeFilter === "all" ? "bg-accent-strong text-white font-semibold shadow-xs" : "text-muted-foreground"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("image")}
              className={`rounded px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                typeFilter === "image" ? "bg-accent-strong text-white font-semibold shadow-xs" : "text-muted-foreground"
              }`}
            >
              Photos
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("video")}
              className={`rounded px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                typeFilter === "video" ? "bg-accent-strong text-white font-semibold shadow-xs" : "text-muted-foreground"
              }`}
            >
              Videos
            </button>
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-strong"
          >
            <option value="all">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-strong"
          >
            <option value="all">All Locations</option>
            <optgroup label="General & Hero">
              <option value="gallery">Gallery Only</option>
              <option value="hero">Hero Only</option>
              <option value="both">Gallery + Hero</option>
            </optgroup>
            <optgroup label="Homepage Sections">
              <option value="about">About Section</option>
              <option value="story">Story Banner</option>
              <option value="wildlife">Wildlife Section</option>
              <option value="experience_1">Exp 1: River Safari</option>
              <option value="experience_2">Exp 2: Mangroves</option>
              <option value="experience_3">Exp 3: Wildlife</option>
            </optgroup>
          </select>

          {/* Hero Filter */}
          <select
            value={heroFilter}
            onChange={(e) => setHeroFilter(e.target.value as "all" | "heroes" | "non_heroes")}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-strong"
          >
            <option value="all">Hero & Gallery</option>
            <option value="heroes">⭐ Active Hero</option>
            <option value="non_heroes">Non-Hero</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "visible" | "hidden")}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-strong"
          >
            <option value="all">All Statuses</option>
            <option value="visible">Visible Only</option>
            <option value="hidden">Hidden Only</option>
          </select>
        </div>
      </div>

      {/* Media Cards Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-accent-strong" />
          <p className="mt-3 text-xs font-medium">Loading website media from server storage...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 px-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Film className="size-6" />
          </div>
          <h3 className="mt-3 font-serif text-lg font-medium text-foreground">No media found</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            {searchQuery || typeFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all"
              ? "No photos or videos match your selected filter criteria."
              : "No photos or videos have been uploaded yet. Upload your first safari photo or boat video to display it on the website."}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button
              type="button"
              variant="forest"
              size="sm"
              onClick={() => openUploadModal("image")}
              className="text-xs"
            >
              + Upload Photo
            </Button>
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={() => openUploadModal("video")}
              className="text-xs"
            >
              + Upload Video
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => {
            const isVideo = item.type === "video";
            const isVisible = item.status === "visible";

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-all hover:shadow-md ${
                  item.is_hero
                    ? "border-amber-400 ring-2 ring-amber-400/40 shadow-amber-500/10"
                    : "border-border hover:border-accent-strong/40"
                }`}
              >
                {/* Media Preview Box */}
                <div
                  className="relative aspect-video w-full overflow-hidden bg-muted cursor-pointer"
                  onClick={() => {
                    setActiveItem(item);
                    setPreviewModalOpen(true);
                  }}
                >
                  {isVideo ? (
                    <div className="relative size-full bg-black/90 flex items-center justify-center">
                      <video
                        src={item.url}
                        className="size-full object-cover opacity-80"
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                        <div className="flex size-11 items-center justify-center rounded-full bg-accent-strong/90 text-white shadow-lg transition-transform group-hover:scale-110">
                          <Play className="size-5 ml-0.5 fill-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}

                  {/* Top Overlay Badges */}
                  <div className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1.5">
                    {item.is_hero && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-sm animate-pulse">
                        <Star className="size-2.5 fill-amber-950 text-amber-950" /> Hero
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isVideo
                          ? "bg-amber-600 text-white"
                          : "bg-emerald-700 text-white"
                      }`}
                    >
                      {isVideo ? <Video className="size-2.5" /> : <ImageIcon className="size-2.5" />}
                      {isVideo ? "Video" : "Photo"}
                    </span>
                    <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                      {item.category}
                    </span>
                  </div>

                  {/* Status Pill Badge (Top Right) */}
                  <div className="absolute right-2.5 top-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                        isVisible
                          ? "bg-emerald-500 text-white"
                          : "bg-neutral-800/90 text-neutral-300"
                      }`}
                    >
                      {isVisible ? <Eye className="size-2.5" /> : <EyeOff className="size-2.5" />}
                      {isVisible ? "Visible" : "Hidden"}
                    </span>
                  </div>
                </div>

                {/* Card Info Body */}
                <div className="flex flex-1 flex-col p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className="font-medium text-xs text-foreground line-clamp-1 group-hover:text-accent-strong transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </h4>
                  </div>

                  {item.description ? (
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted-foreground/60 italic">
                      No description provided
                    </p>
                  )}

                  <div className="mt-2 flex items-center justify-between text-[10px]">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded font-semibold text-[9px] uppercase tracking-wider ${getLocationBadgeClass(
                        item.display_location
                      )}`}
                    >
                      {getLocationBadgeText(item.display_location)}
                    </span>
                    <span className="text-muted-foreground">{item.formatted_size}</span>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="mt-3 flex items-center justify-between border-t border-border/80 pt-2.5">
                    <div className="flex items-center gap-1">
                      {/* Quick Visibility Toggle */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(item)}
                        title={isVisible ? "Click to hide from website" : "Click to make visible on website"}
                        className={`h-7 px-2 text-[11px] cursor-pointer ${
                          isVisible
                            ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {isVisible ? (
                          <>
                            <Eye className="mr-1 size-3" /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="mr-1 size-3" /> Hidden
                          </>
                        )}
                      </Button>

                      {/* Quick Hero Toggle */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleHero(item)}
                        title={
                          item.is_hero
                            ? "Click to unset as Hero (returns to default slideshow)"
                            : "Click to set as website Hero media"
                        }
                        className={`h-7 px-2 text-[11px] cursor-pointer transition-colors ${
                          item.is_hero
                            ? "bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-200"
                            : "text-muted-foreground hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                        }`}
                      >
                        <Star className={`mr-1 size-3 ${item.is_hero ? "fill-amber-500 text-amber-500" : ""}`} />
                        {item.is_hero ? "Hero" : "Set Hero"}
                      </Button>
                    </div>

                    {/* Action icons */}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopyUrl(item)}
                        title="Copy storage URL"
                      >
                        {copiedId === item.id ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => openEditModal(item)}
                        title="Edit media"
                      >
                        <Edit2 className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7 cursor-pointer text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openDeleteModal(item)}
                        title="Delete media and file"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
         UPLOAD MODAL (PHOTOS & VIDEOS FROM PHONE / PC)
         ========================================================================= */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-h-[92vh] w-full max-w-lg overflow-y-auto bg-background p-5 sm:p-6">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-1.5 text-accent-strong">
              {uploadType === "image" ? <ImageIcon className="size-4" /> : <Video className="size-4" />}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {uploadType === "image" ? "Photo Upload" : "Video Upload"}
              </span>
            </div>
            <DialogTitle className="font-serif text-xl font-light text-foreground">
              Upload New {uploadType === "image" ? "Photo" : "Video"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {uploadType === "image"
                ? "Select a photo from your PC or phone gallery (JPG, JPEG, PNG, WEBP up to 15MB)."
                : "Select a video from your PC or phone (MP4, WEBM, MOV up to 100MB)."}
            </DialogDescription>
          </DialogHeader>

          {uploadFormError && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{uploadFormError}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="mt-3 space-y-4">
            {/* File Dropzone / Picker */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Select File <span className="text-destructive">*</span>
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-5 text-center cursor-pointer transition-colors hover:border-accent-strong/50 hover:bg-muted/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={
                    uploadType === "image"
                      ? "image/jpeg,image/png,image/webp,image/jpg"
                      : "video/mp4,video/webm,video/quicktime,video/x-m4v,video/*,.mp4,.webm,.mov,.m4v"
                  }
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />

                {uploadPreviewUrl ? (
                  <div className="w-full space-y-2">
                    {uploadType === "image" ? (
                      <img
                        src={uploadPreviewUrl}
                        alt="Upload preview"
                        className="mx-auto max-h-48 rounded object-contain"
                      />
                    ) : (
                      <video
                        src={uploadPreviewUrl}
                        controls
                        className="mx-auto max-h-48 rounded"
                      />
                    )}
                    <p className="text-[11px] font-medium text-foreground">
                      {uploadFile?.name} ({(uploadFile?.size ? (uploadFile.size / 1024 / 1024).toFixed(2) : 0)} MB)
                    </p>
                    <p className="text-[10px] text-accent-strong">Tap or click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-muted-foreground">
                    <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-accent-strong">
                      <Upload className="size-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      Tap to select {uploadType === "image" ? "a photo" : "a video"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      From your phone photo gallery or PC file browser
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="upload_title" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="upload_title"
                placeholder={uploadType === "image" ? "e.g. Bentota Lagoon Sunset" : "e.g. Mangrove Tunnel Cruise"}
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                disabled={isUploading}
                className="mt-1 h-9 text-xs"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="upload_category" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Category <span className="text-destructive">*</span>
              </Label>
              <div className="mt-1 flex gap-2">
                <select
                  id="upload_category"
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  disabled={isUploading}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-strong"
                >
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="upload_desc" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Description <span className="text-[10px] font-normal normal-case text-muted-foreground">(Optional)</span>
              </Label>
              <textarea
                id="upload_desc"
                rows={2}
                placeholder="Optional short caption or description..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                disabled={isUploading}
                className="mt-1 flex w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-strong"
              />
            </div>

            {/* Status (Visible / Hidden) */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Website Visibility
              </Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUploadStatus("visible")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium cursor-pointer transition-all ${
                    uploadStatus === "visible"
                      ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted/15"
                  }`}
                >
                  <Eye className="size-3.5" />
                  Visible (Live on Website)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadStatus("hidden")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium cursor-pointer transition-all ${
                    uploadStatus === "hidden"
                      ? "border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                      : "border-border text-muted-foreground hover:bg-muted/15"
                  }`}
                >
                  <EyeOff className="size-3.5" />
                  Hidden (Draft / Private)
                </button>
              </div>
            </div>

            {/* Display Location */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Display Location
                </Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Choose where this media appears: in the general Gallery, as the Hero header, or in a specific homepage section.
                </p>
              </div>

              {/* General Locations */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  General & Hero Header
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadLocation("gallery");
                      setUploadIsHero(false);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      uploadLocation === "gallery"
                        ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs ring-1 ring-emerald-600/40"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span className="font-semibold">Gallery</span>
                    <span className="text-[10px] text-muted-foreground">Gallery Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadLocation("hero");
                      setUploadIsHero(true);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      uploadLocation === "hero"
                        ? "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold shadow-xs ring-1 ring-amber-500/40"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span className="font-semibold">Hero</span>
                    <span className="text-[10px] text-muted-foreground">Hero Only</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadLocation("both");
                      setUploadIsHero(true);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      uploadLocation === "both"
                        ? "border-purple-600 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold shadow-xs ring-1 ring-purple-600/40"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span className="font-semibold">Gallery + Hero</span>
                    <span className="text-[10px] text-muted-foreground">Both Places</span>
                  </button>
                </div>
              </div>

              {/* Homepage Feature Sections */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Homepage Section Feature Images
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadLocation("about");
                      setUploadIsHero(false);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      uploadLocation === "about"
                        ? "border-teal-600 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold shadow-xs ring-1 ring-teal-600/40"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span className="font-semibold">About Section</span>
                    <span className="text-[10px] text-muted-foreground">Untamed Beauty Intro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadLocation("story");
                      setUploadIsHero(false);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      uploadLocation === "story"
                        ? "border-indigo-600 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs ring-1 ring-indigo-600/40"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span className="font-semibold">Story Banner</span>
                    <span className="text-[10px] text-muted-foreground">Beyond Shoreline</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadLocation("wildlife");
                      setUploadIsHero(false);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      uploadLocation === "wildlife"
                        ? "border-cyan-600 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold shadow-xs ring-1 ring-cyan-600/40"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span className="font-semibold">Wildlife Section</span>
                    <span className="text-[10px] text-muted-foreground">Life Along River</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadLocation("experience_1");
                      setUploadIsHero(false);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      uploadLocation === "experience_1"
                        ? "border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold shadow-xs ring-1 ring-amber-600/40"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span className="font-semibold">Exp 1: River Safari</span>
                    <span className="text-[10px] text-muted-foreground">Experience Card 1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadLocation("experience_2");
                      setUploadIsHero(false);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      uploadLocation === "experience_2"
                        ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs ring-1 ring-emerald-600/40"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span className="font-semibold">Exp 2: Mangroves</span>
                    <span className="text-[10px] text-muted-foreground">Experience Card 2</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadLocation("experience_3");
                      setUploadIsHero(false);
                    }}
                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                      uploadLocation === "experience_3"
                        ? "border-blue-600 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold shadow-xs ring-1 ring-blue-600/40"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <span className="font-semibold">Exp 3: Wildlife</span>
                    <span className="text-[10px] text-muted-foreground">Experience Card 3</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Set as Active Hero Checkbox */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(uploadLocation === "hero" || uploadLocation === "both") && uploadIsHero}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUploadIsHero(checked);
                    if (checked) {
                      setUploadLocation("both");
                    } else {
                      if (uploadLocation === "hero") {
                        setUploadLocation("gallery");
                      }
                    }
                  }}
                  className="mt-0.5 size-4 rounded border-border text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Star className="size-3.5 fill-amber-500 text-amber-500" />
                    Set as Active Hero Media
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    When enabled, this media will immediately become the active background for the website hero section (replacing any previous Hero).
                  </p>
                </div>
              </label>
            </div>

            {/* Progress Bar during Upload */}
            {isUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Uploading to server storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-accent-strong transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUploadModalOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="forest"
                size="sm"
                disabled={isUploading || !uploadFile}
                className="min-w-28 text-xs font-semibold tracking-wider cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Save & Publish"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
         EDIT MEDIA MODAL
         ========================================================================= */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-h-[92vh] w-full max-w-lg overflow-y-auto bg-background p-5 sm:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="font-serif text-xl font-light text-foreground">
              Edit Media Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update title, category, description or toggle public website visibility.
            </DialogDescription>
          </DialogHeader>

          {editFormError && (
            <div className="mt-2 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{editFormError}</span>
            </div>
          )}

          {activeItem && (
            <form onSubmit={handleEditSubmit} className="mt-3 space-y-4">
              {/* Thumbnail / Media Preview */}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/90">
                {activeItem.type === "video" ? (
                  <video src={activeItem.url} controls className="size-full object-contain" />
                ) : (
                  <img src={activeItem.url} alt={activeItem.title} className="size-full object-contain" />
                )}
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="edit_title" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={isSavingEdit}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="edit_category" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Category <span className="text-destructive">*</span>
                </Label>
                <select
                  id="edit_category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  disabled={isSavingEdit}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-strong"
                >
                  {allCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="edit_desc" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Description
                </Label>
                <textarea
                  id="edit_desc"
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={isSavingEdit}
                  className="mt-1 flex w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent-strong"
                />
              </div>

              {/* Status */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Visibility Status
                </Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditStatus("visible")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium cursor-pointer transition-all ${
                      editStatus === "visible"
                        ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <Eye className="size-3.5" />
                    Visible
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditStatus("hidden")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border p-2 text-xs font-medium cursor-pointer transition-all ${
                      editStatus === "hidden"
                        ? "border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                        : "border-border text-muted-foreground hover:bg-muted/15"
                    }`}
                  >
                    <EyeOff className="size-3.5" />
                    Hidden
                  </button>
                </div>
              </div>

              {/* Display Location */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Display Location
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Choose where this media appears: in the general Gallery, as the Hero header, or in a specific homepage section.
                  </p>
                </div>

                {/* General Locations */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    General & Hero Header
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditLocation("gallery");
                        setEditIsHero(false);
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                        editLocation === "gallery"
                          ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs ring-1 ring-emerald-600/40"
                          : "border-border text-muted-foreground hover:bg-muted/15"
                      }`}
                    >
                      <span className="font-semibold">Gallery</span>
                      <span className="text-[10px] text-muted-foreground">Gallery Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditLocation("hero");
                        setEditIsHero(true);
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                        editLocation === "hero"
                          ? "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold shadow-xs ring-1 ring-amber-500/40"
                          : "border-border text-muted-foreground hover:bg-muted/15"
                      }`}
                    >
                      <span className="font-semibold">Hero</span>
                      <span className="text-[10px] text-muted-foreground">Hero Only</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditLocation("both");
                        setEditIsHero(true);
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                        editLocation === "both"
                          ? "border-purple-600 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-semibold shadow-xs ring-1 ring-purple-600/40"
                          : "border-border text-muted-foreground hover:bg-muted/15"
                      }`}
                    >
                      <span className="font-semibold">Gallery + Hero</span>
                      <span className="text-[10px] text-muted-foreground">Both Places</span>
                    </button>
                  </div>
                </div>

                {/* Homepage Feature Sections */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Homepage Section Feature Images
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditLocation("about");
                        setEditIsHero(false);
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                        editLocation === "about"
                          ? "border-teal-600 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-semibold shadow-xs ring-1 ring-teal-600/40"
                          : "border-border text-muted-foreground hover:bg-muted/15"
                      }`}
                    >
                      <span className="font-semibold">About Section</span>
                      <span className="text-[10px] text-muted-foreground">Untamed Beauty Intro</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditLocation("story");
                        setEditIsHero(false);
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                        editLocation === "story"
                          ? "border-indigo-600 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs ring-1 ring-indigo-600/40"
                          : "border-border text-muted-foreground hover:bg-muted/15"
                      }`}
                    >
                      <span className="font-semibold">Story Banner</span>
                      <span className="text-[10px] text-muted-foreground">Beyond Shoreline</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditLocation("wildlife");
                        setEditIsHero(false);
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                        editLocation === "wildlife"
                          ? "border-cyan-600 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold shadow-xs ring-1 ring-cyan-600/40"
                          : "border-border text-muted-foreground hover:bg-muted/15"
                      }`}
                    >
                      <span className="font-semibold">Wildlife Section</span>
                      <span className="text-[10px] text-muted-foreground">Life Along River</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditLocation("experience_1");
                        setEditIsHero(false);
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                        editLocation === "experience_1"
                          ? "border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold shadow-xs ring-1 ring-amber-600/40"
                          : "border-border text-muted-foreground hover:bg-muted/15"
                      }`}
                    >
                      <span className="font-semibold">Exp 1: River Safari</span>
                      <span className="text-[10px] text-muted-foreground">Experience Card 1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditLocation("experience_2");
                        setEditIsHero(false);
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                        editLocation === "experience_2"
                          ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold shadow-xs ring-1 ring-emerald-600/40"
                          : "border-border text-muted-foreground hover:bg-muted/15"
                      }`}
                    >
                      <span className="font-semibold">Exp 2: Mangroves</span>
                      <span className="text-[10px] text-muted-foreground">Experience Card 2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditLocation("experience_3");
                        setEditIsHero(false);
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center text-xs font-medium cursor-pointer transition-all ${
                        editLocation === "experience_3"
                          ? "border-blue-600 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold shadow-xs ring-1 ring-blue-600/40"
                          : "border-border text-muted-foreground hover:bg-muted/15"
                      }`}
                    >
                      <span className="font-semibold">Exp 3: Wildlife</span>
                      <span className="text-[10px] text-muted-foreground">Experience Card 3</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Set as Active Hero Checkbox */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(editLocation === "hero" || editLocation === "both") && editIsHero}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setEditIsHero(checked);
                      if (checked) {
                        setEditLocation("both");
                      } else {
                        if (editLocation === "hero") {
                          setEditLocation("gallery");
                        }
                      }
                    }}
                    className="mt-0.5 size-4 rounded border-border text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-500 text-amber-500" />
                      Set as Active Hero Media
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      When enabled, this media becomes the active website hero background, replacing any previous Hero selection.
                    </p>
                  </div>
                </label>
              </div>

              {/* Optional Replacement File */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Replace File <span className="text-[10px] font-normal normal-case text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  type="file"
                  accept={
                    activeItem.type === "video"
                      ? "video/mp4,video/webm,video/quicktime,video/x-m4v,video/*,.mp4,.webm,.mov,.m4v"
                      : "image/jpeg,image/png,image/webp,image/jpg"
                  }
                  onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                  disabled={isSavingEdit}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="forest"
                  size="sm"
                  disabled={isSavingEdit}
                  className="min-w-28 text-xs font-semibold tracking-wider cursor-pointer"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
         DELETE CONFIRMATION MODAL
         ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="w-full max-w-md bg-background p-5 sm:p-6">
          <DialogHeader className="text-left">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <DialogTitle className="mt-2 font-serif text-xl font-light text-foreground">
              Delete Media Permanently?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">{activeItem?.title}</strong>?
              This will permanently remove the database record and delete the physical file from server storage.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex justify-end gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="text-xs cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Deleting File...
                </>
              ) : (
                "Yes, Delete Permanently"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
         FULLSCREEN PREVIEW MODAL (LIGHTBOX)
         ========================================================================= */}
      {previewModalOpen && activeItem && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewModalOpen(false)}
        >
          <Button
            variant="heroOutline"
            size="icon"
            className="absolute right-5 top-5 cursor-pointer text-white"
            onClick={() => setPreviewModalOpen(false)}
          >
            <X className="size-5" />
          </Button>

          <div
            className="flex max-h-[88vh] max-w-4xl flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {activeItem.type === "video" ? (
              <video
                src={activeItem.url}
                controls
                autoPlay
                className="max-h-[75vh] max-w-full rounded-lg shadow-2xl"
              />
            ) : (
              <img
                src={activeItem.url}
                alt={activeItem.title}
                className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
            )}

            <div className="mt-3 text-center text-white">
              <h3 className="text-sm font-semibold">{activeItem.title}</h3>
              <p className="text-xs text-white/70">
                {activeItem.category} · {activeItem.formatted_size} · Status: {activeItem.status}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
