"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";
import { PanelLeft, PanelRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { Skeleton } from "../ui/skeleton";

type AppLayoutProps = {
  children: React.ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setIsAuthorized(true);
    } else {
      router.replace('/login');
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 text-center">
                <Skeleton className="h-6 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    return null; // A redirect is in progress.
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
      <div
        className={
          "hidden border-r bg-muted/40 md:flex md:flex-col transition-all duration-300 ease-in-out " +
          (isCollapsed ? "w-16" : "w-64")
        }
      >
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          {!isCollapsed && <Logo />}
        </div>
        <MainNav isCollapsed={isCollapsed} />
      </div>

      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <MainNav isCollapsed={false} />
            </SheetContent>
          </Sheet>
          
          <div className="hidden md:flex items-center">
             <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
                {isCollapsed ? <PanelRight className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
                <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>
          
          <div className="w-full flex-1">
            {/* Can add search bar here if needed */}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
