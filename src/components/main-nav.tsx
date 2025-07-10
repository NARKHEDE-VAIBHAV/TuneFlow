// components/main-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Settings, UploadCloud, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export function MainNav({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();
  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: "/upload",
      label: "Upload",
      icon: <UploadCloud className="h-5 w-5" />,
    },
     {
      href: "/wallet",
      label: "Wallet",
      icon: <Wallet className="h-5 w-5" />,
    },
    {
      href: "/support",
      label: "Support",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex flex-col items-start gap-2 px-2 py-4">
        {navItems.map(({ href, label, icon }) => {
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
