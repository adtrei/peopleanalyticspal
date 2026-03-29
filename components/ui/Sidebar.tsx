"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  UploadCloud,
  BarChart2,
  GitMerge,
  Grid,
  AlertTriangle,
  TrendingUp,
  UserMinus,
  FileText,
  MessageSquare,
  Home,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/profile", label: "Data Profile", icon: BarChart2 },
  { href: "/mapping", label: "Field Mapping", icon: GitMerge },
  { href: "/coverage", label: "Coverage Matrix", icon: Grid },
  { href: "/gaps", label: "Gap Register", icon: AlertTriangle },
  { href: "/headcount", label: "Headcount Explorer", icon: TrendingUp },
  { href: "/attrition", label: "Attrition Explorer", icon: UserMinus },
  { href: "/summary", label: "Executive Summary", icon: FileText },
  { href: "/chat", label: "AI Analyst", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">PA</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">People Analytics Pal</div>
            <div className="text-xs text-gray-400">Workforce Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">v0.1 — MVP</p>
      </div>
    </aside>
  );
}
