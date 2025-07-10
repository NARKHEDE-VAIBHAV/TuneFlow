"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, CircleDollarSign } from "lucide-react";

interface FinancialStatsProps {
  stats: {
    totalSongGrossEarnings: number;
    totalPaidOut: number;
    platformCut: number;
    totalRemainingToPay: number;
  };
}

export function FinancialStats({ stats }: FinancialStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Gross Earnings</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.totalSongGrossEarnings.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Total revenue generated from all songs.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.totalPaidOut.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Total amount successfully paid to users.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Platform Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.platformCut.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Your share of the total gross earnings.</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Payouts</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.totalRemainingToPay.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Total balance payable to all users.</p>
        </CardContent>
      </Card>
    </div>
  );
}
