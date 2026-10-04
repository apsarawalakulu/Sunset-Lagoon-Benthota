import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MediaManager } from "@/components/admin/MediaManager";
import { adminAuth, type AdminUser } from "@/services/adminAuth";

export const Route = createFileRoute("/admin/media")({
  head: () => ({
    meta: [
      { title: "Media Management | Sunset Lagoon Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MediaAdminPage,
});

function MediaAdminPage() {
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
    <AdminLayout admin={admin} pageTitle="Media Management">
      <MediaManager />
    </AdminLayout>
  );
}
