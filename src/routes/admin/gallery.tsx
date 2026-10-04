import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MediaManager } from "@/components/admin/MediaManager";
import { adminAuth, type AdminUser } from "@/services/adminAuth";

export const Route = createFileRoute("/admin/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery & Media Management | Sunset Lagoon Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: GalleryAdminPage,
});

function GalleryAdminPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!adminAuth.isAuthenticated()) {
      navigate({ to: "/admin/login" });
      return;
    }
    setAdmin(adminAuth.getUser());
  }, [navigate]);

  return (
    <AdminLayout admin={admin} pageTitle="Media & Gallery">
      <MediaManager />
    </AdminLayout>
  );
}
