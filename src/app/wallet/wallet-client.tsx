
"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { User, Withdrawal, UnifiedTransaction } from "@/lib/types";
import { calculateWalletSummary, requestWithdrawalAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Wallet as WalletIcon, Banknote, Loader2, Award } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const withdrawalSchema = z.object({
  amount: z.coerce.number().min(500, "Minimum withdrawal is ₹500."),
  upiId: z.string().min(3, "Please enter a valid UPI ID."),
  upiName: z.string().min(2, "Please enter the name on the account."),
});

const withdrawalStatusVariant: Record<Withdrawal['status'], 'default' | 'secondary' | 'destructive'> = {
  'Pending': 'secondary',
  'Completed': 'default',
  'Failed': 'destructive',
};

function WithdrawDialog({ availableBalance, userId, onWithdrawalSuccess }: { availableBalance: number, userId: string, onWithdrawalSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof withdrawalSchema>>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 500,
      upiId: "",
      upiName: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof withdrawalSchema>) => {
    setIsSubmitting(true);
    const result = await requestWithdrawalAction({ userId, ...values });
    if (result.success) {
      toast({ title: "Success", description: result.message });
      onWithdrawalSuccess();
      setIsOpen(false);
      form.reset();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsSubmitting(false);
  };
  
  const isButtonDisabled = availableBalance < 500;

  const trigger = isButtonDisabled ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0}>
            <Button disabled>
              <Banknote className="mr-2" /> Withdraw Funds
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>You need at least ₹500 to make a withdrawal.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <DialogTrigger asChild>
      <Button>
        <Banknote className="mr-2" /> Withdraw Funds
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
          <DialogDescription>
            Enter your UPI details. Funds will be transferred within 3-5 business days.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField name="amount" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (Available: ₹{availableBalance.toFixed(2)})</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="upiId" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>UPI ID</FormLabel>
                <FormControl><Input placeholder="yourname@bank" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="upiName" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Name on UPI Account</FormLabel>
                <FormControl><Input placeholder="Full Name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function WalletClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [walletData, setWalletData] = useState<{
    totalEarnings: number;
    totalWithdrawn: number;
    availableBalance: number;
    transactions: UnifiedTransaction[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWalletData = useCallback(async (userId: string) => {
    try {
      const data = await calculateWalletSummary(userId);
      setWalletData(data);
    } catch (error) {
      console.error("Failed to fetch wallet data", error);
      toast({
          variant: "destructive",
          title: "Failed to load wallet",
          description: "There was an error fetching your wallet data. Please try again later."
      })
    }
  }, [toast]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    setUser(currentUser);
    
    setIsLoading(true);
    fetchWalletData(currentUser.id).finally(() => {
        setIsLoading(false);
    });

  }, [router, fetchWalletData]);
  
  const handleSuccess = () => {
    if (user) {
      fetchWalletData(user.id);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!walletData || !user) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>Could not load wallet data.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Please try refreshing the page.</p>
            </CardContent>
        </Card>
      )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{walletData.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All-time earnings from songs and credits.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{walletData.totalWithdrawn.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total amount paid out to you.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{walletData.availableBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Your current withdrawable balance.</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>A record of all your withdrawals and credits.</CardDescription>
            </div>
            <WithdrawDialog 
                availableBalance={walletData.availableBalance} 
                userId={user.id} 
                onWithdrawalSuccess={handleSuccess}
            />
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {walletData.transactions.length > 0 ? (
                        walletData.transactions.map((tx) => (
                           tx.type === 'withdrawal' ? (
                             <TableRow key={tx.id}>
                                <TableCell>{format(new Date(tx.requestedAt), "PPP")}</TableCell>
                                <TableCell className="flex items-center gap-2"><TrendingDown className="text-destructive"/> Withdrawal</TableCell>
                                <TableCell className="font-medium text-destructive">- ₹{tx.amount.toFixed(2)}</TableCell>
                                <TableCell><Badge variant={withdrawalStatusVariant[tx.status]}>{tx.status}</Badge></TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <div className="text-sm">To: {tx.upiName} ({tx.upiId})</div>
                                     {tx.status !== 'Pending' && tx.adminName && (
                                        <div className="text-xs text-muted-foreground">Processed by: {tx.adminName}</div>
                                     )}
                                </TableCell>
                            </TableRow>
                           ) : (
                            <TableRow key={tx.id}>
                                <TableCell>{format(new Date(tx.createdAt), "PPP")}</TableCell>
                                <TableCell className="flex items-center gap-2"><Award className="text-green-500" /> Credit</TableCell>
                                <TableCell className="font-medium text-green-500">+ ₹{tx.amount.toFixed(2)}</TableCell>
                                <TableCell><Badge variant="default">Completed</Badge></TableCell>
                                <TableCell className="hidden md:table-cell">
                                     <div className="text-sm">{tx.note}</div>
                                     <div className="text-xs text-muted-foreground">By: {tx.adminName}</div>
                                </TableCell>
                            </TableRow>
                           )
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No transactions yet.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
