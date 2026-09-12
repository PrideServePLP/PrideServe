import type { AppNotification } from "./types";

/** Local demo content used until Supabase credentials are configured. */
export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-seed-hours-verified",
    userId: "dev-student_nhs_beta",
    category: "hours",
    title: "Hours verified",
    message:
      '2.5 hours for "Food Pantry Sort & Pack" were verified by Morgan Rivera.',
    href: "/my-hours",
    isRead: false,
    createdAt: "2026-09-08T19:15:00.000Z",
  },
  {
    id: "notif-seed-private-task",
    userId: "dev-student_nhs_beta",
    category: "signup",
    title: "New private assignment",
    message:
      'Morgan Rivera assigned you "Private: Biology Lab Inventory Audit".',
    href: "/my-hours",
    isRead: false,
    createdAt: "2026-09-07T14:02:00.000Z",
  },
  {
    id: "notif-seed-teacher-pending",
    userId: "dev-teacher_advisor",
    category: "hours",
    title: "Hour claims waiting",
    message: "3 student hour logs are waiting on your verification.",
    href: "/admin/approvals",
    isRead: false,
    createdAt: "2026-09-08T12:40:00.000Z",
  },
  {
    id: "notif-seed-org-rejected",
    userId: "dev-outside_org",
    category: "certification",
    title: "Request rejected",
    message:
      '"Weekend Retail Fundraiser Staffing" was not certified. Handling cash and card payments is not eligible for verified service hours.',
    href: "/org-dashboard",
    isRead: true,
    createdAt: "2026-09-05T16:20:00.000Z",
  },
  {
    id: "notif-seed-techmanager-queue",
    userId: "dev-tech_manager",
    category: "certification",
    title: "Certification queue",
    message: "3 requests are waiting on certification.",
    href: "/admin/certification",
    isRead: false,
    createdAt: "2026-09-08T11:05:00.000Z",
  },
];
