"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDb, persistData } from "@/lib/data";
import type { Song, User } from "@/lib/types";

const songSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  singer: z.string().min(1, "Singer is required"),
  description: z.string().min(1, "Description is required"),
  tags: z.array(z.string()),
  bannerDataUrl: z.string().min(1, "Banner is required."),
  audioDataUrl: z.string().min(1, "Audio file is required."),
});

const paidSubmissionSchema = songSchema.extend({
  accountType: z.enum(['Normal Artist', 'Label']),
});

// This action is for users who are already subscribed.
export async function saveSongAction(data: z.infer<typeof songSchema>) {
  const parsed = songSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid data provided." };
  }

  const { userId, bannerDataUrl, audioDataUrl, ...songData } = parsed.data;

  const newSong: Song = {
    id: `song-${Date.now()}`,
    userId: userId,
    ...songData,
    status: 'Waiting for Action',
    submittedAt: new Date(),
    coverArt: bannerDataUrl,
    audioUrl: audioDataUrl,
    bannerUrl: bannerDataUrl,
    totalEarnings: 0,
  };

  const db = getDb();
  db.songs.unshift(newSong);
  persistData(db);

  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");

  return { success: true, message: "Song submitted for approval!" };
}

// This action is for users who are NOT subscribed and need to pay.
// It updates their subscription and saves the song in one go.
export async function processPaidSubmissionAction(data: z.infer<typeof paidSubmissionSchema>) {
   const parsed = paidSubmissionSchema.safeParse(data);
   if (!parsed.success) {
    return { success: false, error: "Invalid song data provided." };
  }
  
  const { userId, accountType, bannerDataUrl, audioDataUrl, ...songData } = parsed.data;

  const db = getDb();

  // Update user's subscription and account type
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: "User not found." };
  }
  
  db.users[userIndex].accountType = accountType;
  
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  db.users[userIndex].subscriptionExpiry = oneYearFromNow;


  // Save the song
  const newSong: Song = {
    id: `song-${Date.now()}`,
    userId: userId,
    ...songData,
    status: 'Waiting for Action',
    submittedAt: new Date(),
    coverArt: bannerDataUrl,
    audioUrl: audioDataUrl,
    bannerUrl: bannerDataUrl,
    totalEarnings: 0,
  };
  db.songs.unshift(newSong);
  
  persistData(db);

  revalidatePath("/dashboard");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users"); // To show new expiry date and account type

  return { success: true, message: "Payment successful and song submitted!" };
}


export async function getSongsForUser(userId: string): Promise<Song[]> {
  const db = getDb();
  return db.songs.filter(song => song.userId === userId);
}

export async function getSubscriptionPriceForCurrentUserAction(userId: string) {
  const db = getDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    throw new Error("User not found");
  }
  const price = db.settings.prices[user.accountType];
  return price;
}
