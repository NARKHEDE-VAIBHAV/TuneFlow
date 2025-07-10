"use client";

import Link from "next/link";
import { AppLayout } from "@/components/layouts/app-layout";
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
import { Badge } from "@/components/ui/badge";
import { getSongsForUser } from "@/app/actions";
import { UploadCloud } from "lucide-react";
import { format } from "date-fns";
import type { Song, User } from "@/lib/types";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const statusVariant: Record<Song['status'], 'default' | 'secondary' | 'destructive'> = {
  'Approved': 'default',
  'Waiting for Action': 'secondary',
  'Declined': 'destructive',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userSongs, setUserSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    setUser(currentUser);

    const fetchSongs = async () => {
      setIsLoading(true);
      try {
        // The result from the server action will have dates as strings
        const songsFromServer = await getSongsForUser(currentUser.id);
        // Convert date strings back to Date objects
        const songs = songsFromServer.map(song => ({
          ...song,
          // Dates from server actions are serialized as strings
          submittedAt: new Date(song.submittedAt),
        }));
        setUserSongs(songs);
      } catch (error) {
        console.error("Failed to fetch user songs", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, [router]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-36" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-80 mt-2" />
            </CardHeader>
            <CardContent>
             <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
             </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    // This state is briefly hit before the redirect in useEffect.
    // Returning null prevents trying to render the page with a null user.
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-headline">My Dashboard</h2>
            <p className="text-muted-foreground">
              Here's a list of your uploaded songs and their approval status.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/upload">
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload Song
              </Link>
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>My Submissions</CardTitle>
            <CardDescription>
              Manage your music submissions and see their approval status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Singer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Submitted</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userSongs.length > 0 ? (
                  userSongs.map((song) => (
                    <TableRow key={song.id}>
                      <TableCell className="font-medium">{song.title}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {song.singer}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[song.status]}>
                          {song.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {format(song.submittedAt, "PPP")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{((song.totalEarnings || 0) * user.payoutRate).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      You haven't uploaded any songs yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
