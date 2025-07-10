'use server';

import { getDb } from '@/lib/data';
import type { Song, User, Ticket, AppSettings, Withdrawal } from '@/lib/types';

export async function getPendingSongs(): Promise<Song[]> {
    const db = getDb();
    return db.songs.filter((song) => song.status === 'Waiting for Action');
}

export async function getApprovedSongs(): Promise<Song[]> {
    const db = getDb();
    return db.songs.filter((song) => song.status === 'Approved');
}

export async function getAllUsers(): Promise<Omit<User, 'password'>[]> {
    const db = getDb();
    // In a real app, be careful about exposing all user data.
    // Here we omit passwords.
    return db.users.map(({ password, ...user }) => user);
}

export async function getAllTickets(): Promise<Ticket[]> {
  const db = getDb();
  return db.tickets || [];
}

export async function getSettings(): Promise<AppSettings> {
    const db = getDb();
    return db.settings;
}

export async function getAllWithdrawals(): Promise<Withdrawal[]> {
    const db = getDb();
    return (db.withdrawals || []).sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

export async function getPlatformFinancials() {
    const db = getDb();
    const { users, songs, withdrawals, credits } = db;

    const totalSongGrossEarnings = songs.reduce((sum, song) => sum + (song.totalEarnings || 0), 0);

    const totalPaidOut = withdrawals
        .filter(w => w.status === 'Completed')
        .reduce((sum, w) => sum + w.amount, 0);
    
    // Platform cut is the portion of gross earnings the platform keeps.
    const platformCut = songs.reduce((sum, song) => {
        const user = users.find(u => u.id === song.userId);
        const payoutRate = user?.payoutRate ?? 0.8;
        const songEarning = song.totalEarnings || 0;
        return sum + (songEarning * (1 - payoutRate));
    }, 0);
    
    // This is the total amount owed to users from song earnings.
    const totalUserSideEarnings = songs.reduce((sum, song) => {
        const user = users.find(u => u.id === song.userId);
        const payoutRate = user?.payoutRate ?? 0.8;
        const songEarning = song.totalEarnings || 0;
        return sum + (songEarning * payoutRate);
    }, 0);

    // This is the total amount from manual credits.
    const totalCredits = credits.reduce((sum, credit) => sum + credit.amount, 0);
    
    // The total outstanding balance owed to users (including pending withdrawals).
    const totalRemainingToPay = (totalUserSideEarnings + totalCredits) - totalPaidOut;

    return {
        totalSongGrossEarnings,
        totalPaidOut,
        platformCut,
        totalRemainingToPay
    };
}
