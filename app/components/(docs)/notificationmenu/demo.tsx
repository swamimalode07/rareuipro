"use client";

import { useEffect, useState } from "react";
import NotificationMenu, { type NotificationItem } from "@/components/pro/notification-menu";

const initial: NotificationItem[] = [
  {
    id: "1",
    title: "Maya Chen",
    body: "Left a comment on Pricing: “Can we try a warmer orange here?”",
    time: "2m",
  },
  {
    id: "2",
    title: "Deploy finished",
    body: "rare-ui main is live. Build took 41 seconds.",
    time: "18m",
  },
  {
    id: "3",
    title: "Jonas Weber",
    body: "Invited you to the Onboarding board.",
    time: "1h",
  },
  {
    id: "4",
    title: "Invoice paid",
    body: "Northwind paid invoice #1043.",
    time: "Yesterday",
    read: true,
  },
];

const arriving: NotificationItem = {
  id: "5",
  title: "Priya Nair",
  body: "Mentioned you in Release notes.",
  time: "now",
};

export default function NotificationMenuDemo() {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    const timer = window.setTimeout(() => setItems((list) => [arriving, ...list]), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-full items-start justify-center p-6 pt-[18vh]">
      <NotificationMenu notifications={items} />
    </div>
  );
}
