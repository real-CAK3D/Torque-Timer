"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function MarkRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!hasUnread) return;
    const t = setTimeout(() => fetch("/api/admin/notifications", { method: "POST" }).then(() => router.refresh()), 1500);
    return () => clearTimeout(t);
  }, [hasUnread, router]);
  return null;
}
