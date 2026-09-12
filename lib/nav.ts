import type { LucideIcon } from "lucide-react";
import {
  Award,
  Building2,
  Clock,
  GraduationCap,
  LayoutDashboard,
  LayoutList,
  Shield,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  {
    href: "/",
    label: "General Task Feed",
    description: "Public view",
    icon: LayoutList,
  },
  {
    href: "/honor-societies",
    label: "Honor Societies Hub",
    description: "NHS, NJHS, and more",
    icon: Award,
  },
  {
    href: "/peer-tutoring",
    label: "Peer Tutoring",
    description: "Request or offer help",
    icon: GraduationCap,
  },
  {
    href: "/my-hours",
    label: "My Hour History",
    description: "Progress and logged hours",
    icon: Clock,
  },
  {
    href: "/teacher-dashboard",
    label: "Teacher / Advisor Dashboard",
    description: "Post and verify hours",
    icon: LayoutDashboard,
  },
  {
    href: "/org-dashboard",
    label: "Outside Org Portal",
    description: "Non-profit submissions",
    icon: Building2,
  },
  {
    href: "/admin",
    label: "Admin & Tech Manager Portal",
    description: "School-wide settings",
    icon: Shield,
  },
];
