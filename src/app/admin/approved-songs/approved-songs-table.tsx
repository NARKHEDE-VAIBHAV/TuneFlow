"use client";

import { useState } from "react";
import type { Song, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Download, Loader2, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSongEarningsAction } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

function ViewSongDialog({ song, user }: { song: Song; user: Omit<User, "password" | "payoutRate"> & { payoutRate: number } | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [earnings, setEarnings] = useState(song.totalEarnings || 0);
  const { toast } = useToast();
  const router = useRouter();

  const handleSaveEarnings = async () => {
      setIsSaving(true);
      const result = await updateSongEarningsAction(song.id, earnings);
      if (result.success) {
          toast({ title: "Success", description: result.message });
          router.refresh(); // This will re-fetch data on the server component and pass it down
      } else {
          toast({ variant: "destructive", title: "Error", description: result.error });
      }
      setIsSaving(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        View
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
          <Separator />
           <div className="space-y-3">
            <h4 className="font-medium text-sm">Manage Earnings</h4>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="earnings" className="text-right">
                Total Gross (₹)
              </Label>
              <Input
                id="earnings"
                type="number"
                value={earnings}
                onChange={(e) => setEarnings(parseFloat(e.target.value) || 0)}
                className="col-span-2"
              />
            </div>
             <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right text-muted-foreground">Artist Payout ({ (user?.payoutRate || 0) * 100 }%)</Label>
                <p className="col-span-2 font-semibold">
                    ₹{((earnings || 0) * (user?.payoutRate || 0.8)).toFixed(2)}
                </p>
             </div>
             <div className="flex justify-end">
                <Button onClick={handleSaveEarnings} disabled={isSaving} size="sm">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2" />
                    Save Earnings
                </Button>
             </div>
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
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ApprovedSongsTableProps {
  songs: Song[];
  users: Omit<User, 'password'>[];
}

export function ApprovedSongsTable({ songs, users }: ApprovedSongsTableProps) {
  const getUserName = (userId: string) => {
    return users.find((user) => user.id === userId)?.name || "Unknown User";
  };
  const getAdminName = (adminId?: string) => {
    if (!adminId) return 'N/A';
    return users.find((user) => user.id === adminId)?.name || "Unknown Admin";
  };
  const getUser = (userId: string) => {
    return users.find((user) => user.id === userId);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Published Music</CardTitle>
        <CardDescription>Browse all approved music submissions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead className="hidden md:table-cell">Submitted</TableHead>
              <TableHead className="hidden md:table-cell">Approved By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {songs.length > 0 ? (
              songs.map((song) => (
                <TableRow key={song.id}>
                  <TableCell>
                    <div className="font-medium">{song.title}</div>
                  </TableCell>
                  <TableCell>{song.author}</TableCell>
                  <TableCell>{getUserName(song.userId)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(song.submittedAt), "PPP")}
                  </TableCell>
                   <TableCell className="hidden md:table-cell">
                    {getAdminName(song.actionedBy)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ViewSongDialog song={song} user={getUser(song.userId)} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No approved songs found.
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
