"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Song, User } from "@/lib/types";
import { Check, Download, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { approveSongAction, declineSongAction } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

function ReviewSongDialog({
  song,
  user,
  onActionComplete,
}: {
  song: Song;
  user: Omit<User, "password"> | undefined;
  onActionComplete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const adminUser = getCurrentUser();

  const handleApprove = async () => {
    if (!adminUser) {
      toast({ variant: "destructive", title: "Error", description: "Could not identify admin user." });
      return;
    }
    setIsSubmitting(true);
    const result = await approveSongAction(song.id, adminUser.id);
    if (result.success) {
      toast({ title: "Success", description: "Song has been approved." });
      onActionComplete();
      setIsOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Could not approve the song.",
      });
    }
    setIsSubmitting(false);
  };

  const handleDecline = async () => {
    if (!adminUser) {
      toast({ variant: "destructive", title: "Error", description: "Could not identify admin user." });
      return;
    }
    setIsSubmitting(true);
    const result = await declineSongAction(song.id, adminUser.id);
    if (result.success) {
      toast({ title: "Success", description: "Song has been declined." });
      onActionComplete();
      setIsOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Could not decline the song.",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Review
      </Button>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{song.title}</DialogTitle>
          <DialogDescription>
            By {song.author} | Performed by {song.singer} | Submitted by{" "}
            {user?.name || "Unknown"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p>{song.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {song.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Playback</h4>
            <audio controls className="w-full h-10">
              <source src={song.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
        <DialogFooter className="sm:justify-between items-center">
          <div className="flex-1 flex gap-2">
            <Button variant="ghost" asChild>
              <a href={song.audioUrl} download={`${song.title}.mp3`}>
                <Download className="mr-2 h-4 w-4" />
                MP3
              </a>
            </Button>
            <Button variant="ghost" asChild>
              <a href={song.bannerUrl} download={`${song.title}-banner.png`}>
                <Download className="mr-2 h-4 w-4" />
                Banner
              </a>
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDecline}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <X className="mr-2 h-4 w-4" />
              Decline
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


interface DashboardClientProps {
    initialSongs: Song[];
    initialUsers: Omit<User, 'password'>[];
}

export function DashboardClient({ initialSongs, initialUsers }: DashboardClientProps) {
    const router = useRouter();

    const getUser = (userId: string) => {
        return initialUsers.find((user) => user.id === userId);
    };

    // This function will be called after an action.
    // Instead of manipulating local state, we just tell Next.js to refresh the data from the server.
    const handleActionComplete = () => {
        router.refresh();
    };

    return (
        <Card>
            <CardHeader>
            <CardTitle>Approval Queue</CardTitle>
            <CardDescription>
                These songs are waiting for your review.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead className="hidden md:table-cell">
                    Submitted By
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                    Submitted
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {initialSongs.length > 0 ? (
                    initialSongs.map((song) => (
                        <TableRow key={song.id}>
                        <TableCell>
                            <div className="font-medium">{song.title}</div>
                        </TableCell>
                        <TableCell>{song.author}</TableCell>
                        <TableCell className="hidden md:table-cell">
                            {getUser(song.userId)?.name || "Unknown User"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                             {/* Dates passed from server to client components are serialized as strings */}
                            {format(new Date(song.submittedAt), "PPP")}
                        </TableCell>
                        <TableCell className="text-right">
                            <ReviewSongDialog
                            song={song}
                            user={getUser(song.userId)}
                            onActionComplete={handleActionComplete}
                            />
                        </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            No pending songs to review.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
    );
}
