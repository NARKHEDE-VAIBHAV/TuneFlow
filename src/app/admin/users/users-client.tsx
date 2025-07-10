
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@/lib/types";
import { getCurrentUser, isSuperAdmin } from "@/lib/auth";
import { grantSubscriptionAction, revokeSubscriptionAction, updateUserAccountTypeAction, updateUserRoleAction, updateUserPayoutRateAction, addCreditAction } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const roleVariant: Record<User['role'], 'default' | 'secondary' | 'destructive'> = {
  'User': 'secondary',
  'Admin': 'default',
  'Super Admin': 'destructive',
};

const accountTypeVariant: Record<User['accountType'], 'default' | 'secondary'> = {
    'Normal Artist': 'secondary',
    'Label': 'default'
}

const addCreditSchema = z.object({
  amount: z.coerce.number().positive("Amount must be a positive number."),
  note: z.string().min(5, "Note must be at least 5 characters.").max(100, "Note cannot exceed 100 characters."),
});

function AddCreditDialog({ user, admin, onActionComplete }: { user: Omit<User, "password">; admin: User, onActionComplete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof addCreditSchema>>({
        resolver: zodResolver(addCreditSchema),
        defaultValues: { amount: 100, note: "" },
    });
    
    const onSubmit = async (values: z.infer<typeof addCreditSchema>) => {
        const result = await addCreditAction(user.id, admin.id, values.amount, values.note);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            onActionComplete();
            form.reset();
            setIsOpen(false);
        } else {
            toast({ variant: "destructive", title: "Error", description: result.error });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Add Credit</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Credit to {user.name}</DialogTitle>
                    <DialogDescription>
                        Manually add funds to a user's wallet. This will be reflected in their balance immediately.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="amount" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount (₹)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="note" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reason / Note</FormLabel>
                                <FormControl><Textarea placeholder="e.g. Bonus for top performing song" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                                Confirm Credit
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

interface UsersClientProps {
  initialUsers: Omit<User, 'password'>[];
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (!isSuperAdmin(user)) {
      router.replace('/admin/dashboard');
    }
    setIsLoading(false);
  }, [router]);
  
  const handleActionComplete = () => {
    router.refresh();
  }

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    const result = await updateUserRoleAction(userId, newRole);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      handleActionComplete();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleAccountTypeChange = async (userId: string, newAccountType: User['accountType']) => {
    const result = await updateUserAccountTypeAction(userId, newAccountType);
    if (result.success) {
        toast({ title: "Success", description: result.message });
        handleActionComplete();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleGrantSubscription = async (userId: string, months: number) => {
    const result = await grantSubscriptionAction(userId, months);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      handleActionComplete();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handleRevokeSubscription = async (userId: string) => {
    const result = await revokeSubscriptionAction(userId);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      handleActionComplete();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
  };

  const handlePayoutRateChange = async (userId: string, rate: string) => {
    const rateValue = parseFloat(rate);
    if (isNaN(rateValue)) return;
    
    const result = await updateUserPayoutRateAction(userId, rateValue);
    if (result.success) {
        toast({ title: "Success", description: result.message });
        handleActionComplete();
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
    }
  }

  if (isLoading || !isSuperAdmin(currentUser)) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-80 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>View and manage all registered users.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Account Type</TableHead>
              <TableHead>Payout Rate (%)</TableHead>
              <TableHead>Sub. Expiry</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell><Badge variant={roleVariant[user.role]}>{user.role}</Badge></TableCell>
                <TableCell><Badge variant={accountTypeVariant[user.accountType]}>{user.accountType}</Badge></TableCell>
                <TableCell>
                  {currentUser?.id !== user.id ? (
                     <Input
                        type="number"
                        defaultValue={user.payoutRate * 100}
                        onBlur={(e) => handlePayoutRateChange(user.id, e.target.value)}
                        className="w-20"
                        />
                  ) : (
                    <span>{user.payoutRate * 100}</span>
                  )}
                </TableCell>
                <TableCell>{user.subscriptionExpiry ? format(new Date(user.subscriptionExpiry), 'PPP') : 'N/A'}</TableCell>
                <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-2">
                        {currentUser?.id !== user.id && (
                            <>
                                <Select
                                    defaultValue={user.role}
                                    onValueChange={(newRole: User['role']) => handleRoleChange(user.id, newRole)}
                                    >
                                    <SelectTrigger className="w-[120px] inline-flex">
                                        <SelectValue placeholder="Change role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="User">User</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    defaultValue={user.accountType}
                                    onValueChange={(newAccountType: User['accountType']) => handleAccountTypeChange(user.id, newAccountType)}
                                >
                                    <SelectTrigger className="w-[150px] inline-flex">
                                        <SelectValue placeholder="Change Account Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Normal Artist">Normal Artist</SelectItem>
                                        <SelectItem value="Label">Label</SelectItem>
                                    </SelectContent>
                                </Select>
                                 <AddCreditDialog user={user} admin={currentUser} onActionComplete={handleActionComplete} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="w-[140px]">Manage Sub</Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Grant Subscription</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleGrantSubscription(user.id, 1)}>1 Month</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleGrantSubscription(user.id, 3)}>3 Months</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleGrantSubscription(user.id, 6)}>6 Months</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleGrantSubscription(user.id, 12)}>1 Year</DropdownMenuItem>
                                        {user.subscriptionExpiry && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                            onClick={() => handleRevokeSubscription(user.id)}
                                            >
                                            Revoke Subscription
                                            </DropdownMenuItem>
                                        </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        )}
                    </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
