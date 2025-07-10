"use client";

import { useState } from "react";
import type { Ticket, User, TicketReply } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, Send, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { replyToTicketAction, closeTicketAction } from "../actions";
import { getCurrentUser } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const statusVariant: Record<Ticket['status'], 'default' | 'secondary' | 'destructive'> = {
  'Open': 'default',
  'Closed': 'destructive',
};

function ViewTicketDialog({ ticket, user, onActionComplete }: { ticket: Ticket; user: Omit<User, "password"> | undefined; onActionComplete: () => void; }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const { toast } = useToast();
  const adminUser = getCurrentUser();

  const handleReply = async () => {
    if (!replyMessage.trim() || !adminUser) return;
    setIsSubmitting(true);
    const result = await replyToTicketAction(ticket.id, adminUser.id, replyMessage);
    if (result.success) {
      toast({ title: "Success", description: "Your reply has been sent." });
      setReplyMessage("");
      onActionComplete();
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsSubmitting(false);
  };
  
  const handleClose = async () => {
    setIsSubmitting(true);
    const result = await closeTicketAction(ticket.id);
     if (result.success) {
      toast({ title: "Success", description: "Ticket has been closed." });
      onActionComplete();
      setIsOpen(false);
    } else {
      toast({ variant: "destructive", title: "Error", description: result.error });
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        View
      </Button>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{ticket.subject}</DialogTitle>
          <DialogDescription>
            Ticket from {user?.name || "Unknown"} | Status:{" "}
            <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ScrollArea className="h-[300px] p-4 border rounded-md">
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <Avatar>
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="p-3 rounded-lg bg-muted w-full">
                        <p className="font-semibold text-sm">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(ticket.submittedAt), "PPP p")}</p>
                        <p className="mt-2 text-sm">{ticket.message}</p>
                        {ticket.photoUrl && <img src={ticket.photoUrl} data-ai-hint="placeholder" alt="Attachment" className="mt-2 rounded-md max-w-sm" />}
                    </div>
                </div>

                 {ticket.replies.map((reply: TicketReply) => {
                    const replier = reply.userId === adminUser?.id ? adminUser : user;
                    const isAuthorAdmin = reply.userId === adminUser?.id;
                    return (
                        <div key={reply.id} className={`flex items-start gap-3 ${isAuthorAdmin ? 'justify-end' : ''}`}>
                             {!isAuthorAdmin && (
                                 <Avatar>
                                    <AvatarImage src={replier?.avatar} />
                                    <AvatarFallback>{replier?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                             )}
                             <div className={`p-3 rounded-lg w-full ${isAuthorAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="font-semibold text-sm">{replier?.name}</p>
                                <p className={`text-xs ${isAuthorAdmin ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{format(new Date(reply.createdAt), "PPP p")}</p>
                                <p className="mt-2 text-sm">{reply.message}</p>
                            </div>
                            {isAuthorAdmin && (
                                 <Avatar>
                                    <AvatarImage src={replier?.avatar} />
                                    <AvatarFallback>{replier?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                             )}
                        </div>
                    )
                 })}
            </div>
        </ScrollArea>
        {ticket.status === 'Open' && (
            <div className="space-y-4">
                 <Separator />
                 <div>
                    <Textarea placeholder="Type your reply here..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} disabled={isSubmitting} />
                 </div>
                 <DialogFooter className="sm:justify-between">
                    <Button variant="destructive" onClick={handleClose} disabled={isSubmitting}>
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <XCircle className="mr-2 h-4 w-4" /> Close Ticket
                    </Button>
                    <Button onClick={handleReply} disabled={isSubmitting || !replyMessage.trim()}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Send className="mr-2 h-4 w-4" /> Send Reply
                    </Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface SupportClientProps {
  initialTickets: Ticket[];
  initialUsers: Omit<User, 'password'>[];
}

export function SupportClient({ initialTickets, initialUsers }: SupportClientProps) {
  const router = useRouter();

  const getUser = (userId: string) => {
    return initialUsers.find((user) => user.id === userId);
  };
  
  const handleActionComplete = () => {
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Queue</CardTitle>
        <CardDescription>
          All support tickets are listed below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialTickets.length > 0 ? (
              initialTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.subject}</TableCell>
                  <TableCell>{getUser(ticket.userId)?.name || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(ticket.submittedAt), "PPP")}
                  </TableCell>
                  <TableCell className="text-right">
                    <ViewTicketDialog ticket={ticket} user={getUser(ticket.userId)} onActionComplete={handleActionComplete} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No support tickets found.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
