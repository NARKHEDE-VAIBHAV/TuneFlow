"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from "@/components/layouts/app-layout";
import { ChangePasswordForm } from "@/components/dashboard/change-password-form";
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    setUser(currentUser);
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className='mb-8'>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <div className="max-w-2xl">
            <Skeleton className="h-[450px] w-full" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null; // Redirecting
  }

  return (
    <AppLayout>
      <div className="space-y-6">
         <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences.
            </p>
        </div>
        <div className="max-w-2xl">
            <ChangePasswordForm user={user} />
        </div>
      </div>
    </AppLayout>
  );
}
