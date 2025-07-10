// components/admin-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, BarChart, LifeBuoy, ListMusic, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useEffect, useState } from "react";
import { getCurrentUser, isSuperAdmin } from "@/lib/auth";
import type { User } from "@/lib/types";

export function AdminNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  const navItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <BarChart className="h-5 w-5" />,
      show: true,
    },
    {
      href: "/admin/approved-songs",
      label: "Approved Songs",
      icon: <ListMusic className="h-5 w-5" />,
      show: true,
    },
    {
      href: "/admin/withdrawals",
      label: "Withdrawals",
      icon: <Banknote className="h-5 w-5" />,
      show: true,
    },
    {
      href: "/admin/support",
      label: "Support Tickets",
      icon: <LifeBuoy className="h-5 w-5" />,
      show: true,
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: <Users className="h-5 w-5" />,
      show: isSuperAdmin(user),
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      show: isSuperAdmin(user),
    },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex flex-col items-start gap-2 px-2 py-4">
        {navItems.map(({ href, label, icon, show }) => {
          if (!show) return null;
          const isActive = pathname.startsWith(href);
          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-accent text-primary",
                    isCollapsed && "justify-center"
                  )}
                >
                  {icon}
                  {!isCollapsed && <span>{label}</span>}
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  {label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
