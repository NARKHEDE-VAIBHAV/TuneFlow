"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  // Render a loading state while the redirect is happening
  // to prevent a flash of unstyled content.
  return (
    <div className="flex h-screen w-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}
