'use client';

import { useEffect, useState } from 'react';
import { getCurrentUser, isSuperAdmin } from '@/lib/auth';
import type { User } from '@/lib/types';
import { FinancialStats } from './financial-stats';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialStatsWrapperProps {
  stats: {
    totalSongGrossEarnings: number;
    totalPaidOut: number;
    platformCut: number;
    totalRemainingToPay: number;
  };
}

export function FinancialStatsWrapper({ stats }: FinancialStatsWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setIsLoading(false);
  }, []);

  if (isLoading) {
    // We show a skeleton here to prevent layout shift while checking the user role
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
        </div>
    );
  }

  if (isSuperAdmin(user)) {
    return <FinancialStats stats={stats} />;
  }

  // Render nothing if the user is not a Super Admin
  return null;
}
