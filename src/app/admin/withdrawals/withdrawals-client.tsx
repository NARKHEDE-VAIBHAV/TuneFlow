
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Withdrawal, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { updateWithdrawalStatusAction } from "../actions";
import { getCurrentUser } from "@/lib/auth";

const statusVariant: Record<Withdrawal['status'], 'default' | 'secondary' | 'destructive'> = {
  'Pending': 'secondary',
  'Completed': 'default',
  'Failed': 'destructive',
};

interface WithdrawalsClientProps {
  initialWithdrawals: Withdrawal[];
  initialUsers: Omit<User, 'password'>[];
}

export function WithdrawalsClient({ initialWithdrawals, initialUsers }: WithdrawalsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const adminUser = getCurrentUser();
  
  const getUserName = (userId: string) => {
    return initialUsers.find((user) => user.id === userId)?.name || "Unknown";
  };
  
  const getAdminName = (adminId?: string) => {
    if (!adminId) return 'N/A';
    return initialUsers.find((user) => user.id === adminId)?.name || "Unknown Admin";
  }

  const handleStatusChange = async (withdrawalId: string, status: Withdrawal['status']) => {
    if (!adminUser) {
        toast({ variant: "destructive", title: "Error", description: "Could not identify admin user." });
        return;
    }
    const result = await updateWithdrawalStatusAction(withdrawalId, adminUser.id, status);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      router.refresh();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Withdrawal Requests</CardTitle>
        <CardDescription>Review and update the status of withdrawal requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>UPI ID</TableHead>
              <TableHead>UPI Name</TableHead>
              <TableHead className="hidden md:table-cell">Requested At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action / Processed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialWithdrawals.length > 0 ? (
              initialWithdrawals.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{getUserName(w.userId)}</TableCell>
                  <TableCell>₹{w.amount.toFixed(2)}</TableCell>
                  <TableCell>{w.upiId}</TableCell>
                  <TableCell>{w.upiName}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(w.requestedAt), "PPP p")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[w.status]}>{w.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {w.status === 'Pending' ? (
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                Manage
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(w.id, 'Completed')}>
                            Mark as Completed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleStatusChange(w.id, 'Failed')}
                            >
                            Mark as Failed
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="font-medium">{getAdminName(w.processedBy)}</div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No withdrawal requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
