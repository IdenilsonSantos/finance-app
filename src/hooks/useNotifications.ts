"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/api/client";

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function useNotifications(page = 1, limit = 20) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<{ data: AppNotification[]; total: number }>(
        `/notifications?page=${page}&limit=${limit}`,
      );
      setNotifications(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch {}
  }, [page, limit]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api.get<{ count: number }>("/notifications/unread-count");
      setUnreadCount(data.count);
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchNotifications(), fetchUnreadCount()]).finally(() =>
      setLoading(false),
    );
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    if (!session?.accessToken) return;

    const socket = io(`${API_URL}/notifications`, {
      auth: { token: session.accessToken },
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("notification", (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);

      if (notification.type === "scheduledReminder") {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["scheduled-transactions"] });
        queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    });

    socket.on("unread_count", ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.accessToken]);

  const markAsRead = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/read`, {}).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await api.patch("/notifications/read-all", {}).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteRead = useCallback(async () => {
    await api.delete("/notifications/read").catch(() => {});
    setNotifications((prev) => prev.filter((n) => !n.read));
  }, []);

  const deleteOne = useCallback(async (id: string) => {
    const wasUnread = notifications.find((n) => n.id === id)?.read === false;
    await api.delete(`/notifications/${id}`).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  }, [notifications]);

  const deleteAll = useCallback(async () => {
    await api.delete("/notifications/all").catch(() => {});
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markAsUnread = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/unread`, {}).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
    );
    setUnreadCount((c) => c + 1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    notifications,
    total,
    page,
    totalPages,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    markAsUnread,
    deleteOne,
    deleteRead,
    deleteAll,
    refetch: fetchNotifications,
  };
}
