"use client";

import { useEffect, useState } from "react";
import type { Ticket, User } from "@/lib/types";
import { getTicketsForUser } from "@/app/support/actions";
import { getCurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "../ui/skeleton";

const statusVariant: Record<Ticket['status'], 'default' | 'secondary' | 'destructive'> = {
  'Open': 'default',
  'Closed': 'destructive',
};

export function TicketList() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    setUser(currentUser);

    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const userTickets = await getTicketsForUser(currentUser.id);
        setTickets(userTickets);
      } catch (error) {
        console.error("Failed to fetch user tickets", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTickets();
  }, [router]);

  if (isLoading) {
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
        <CardTitle>My Support Tickets</CardTitle>
        <CardDescription>Here is a list of your support requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Submitted</TableHead>
              <TableHead className="hidden md:table-cell text-right">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.subject}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(ticket.submittedAt), "PPP")}
                  </TableCell>
                   <TableCell className="hidden md:table-cell text-right">
                    {ticket.replies.length > 0 
                      ? format(new Date(ticket.replies[ticket.replies.length - 1].createdAt), "PPP")
                      : format(new Date(ticket.submittedAt), "PPP")
                    }
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  You haven't submitted any tickets yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
