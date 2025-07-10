import type { Song, User, Ticket, TicketReply, MockDb, AppSettings, Withdrawal, Credit } from './types';
import fs from 'fs';
import path from 'path';

// This file simulates a database by storing data in a JSON file.
// This allows data to persist across server restarts.

// Define the path to the db.json file in the project root
const dbPath = path.join(process.cwd(), 'db.json');

// This is the shape of the data when it's stored in the JSON file.
// Dates are stored as ISO strings.
interface MockDbSerialized {
    users: (Omit<User, 'subscriptionExpiry' | 'payoutRate'> & { subscriptionExpiry?: string | null, payoutRate?: number })[];
    songs: (Omit<Song, 'submittedAt' | 'actionedAt'> & { submittedAt: string; actionedAt?: string, totalEarnings?: number })[];
    tickets: (Omit<Ticket, 'submittedAt' | 'replies'> & { submittedAt: string; replies: (Omit<TicketReply, 'createdAt'> & { createdAt: string })[] })[];
    withdrawals: (Omit<Withdrawal, 'requestedAt' | 'processedAt'> & { requestedAt: string; processedAt?: string })[];
    credits: (Omit<Credit, 'createdAt'> & { createdAt: string })[];
    settings: AppSettings;
}

const initialUsers: User[] = [
  {
    id: 'user-1',
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: '12345678',
    role: 'Super Admin',
    accountType: 'Label',
    subscriptionExpiry: new Date('2099-01-01'), // A date far in the future
    avatar: 'https://i.pravatar.cc/150?u=admin@gmail.com',
    payoutRate: 0.8,
  },
  {
    id: 'user-2',
    name: 'Melody Maker',
    email: 'melody@example.com',
    password: 'password123',
    role: 'User',
    accountType: 'Normal Artist',
    subscriptionExpiry: undefined,
    avatar: 'https://i.pravatar.cc/150?u=melody@example.com',
    payoutRate: 0.8,
  },
];

const initialSettings: AppSettings = {
    prices: {
        'Normal Artist': 999,
        'Label': 1999,
    }
}

const placeholderAudio = 'https://storage.googleapis.com/studioprototype.appspot.com/assets/placeholder-audio.mp3';

const initialSongs: Song[] = [
  {
    id: '1',
    userId: 'user-2',
    title: 'Echoes of Tomorrow',
    author: 'Alex Ray',
    singer: 'Luna',
    description: 'A futuristic synthwave track with driving basslines and ethereal melodies.',
    tags: ['synthwave', 'electronic', '80s'],
    status: 'Approved',
    submittedAt: new Date('2023-10-26'),
    coverArt: 'https://placehold.co/600x600.png',
    audioUrl: placeholderAudio,
    bannerUrl: 'https://placehold.co/3000x3000.png',
    actionedBy: 'user-1',
    actionedAt: new Date('2023-10-27'),
    totalEarnings: 1250,
  },
];


// Helper to serialize data for writing to JSON
function serializeData(data: MockDb): MockDbSerialized {
    return {
        users: data.users.map(user => ({
            ...user,
            subscriptionExpiry: user.subscriptionExpiry?.toISOString() || null,
        })),
        songs: data.songs.map(song => ({
            ...song,
            submittedAt: song.submittedAt.toISOString(),
            actionedAt: song.actionedAt?.toISOString(),
        })),
        tickets: data.tickets.map(ticket => ({
            ...ticket,
            submittedAt: ticket.submittedAt.toISOString(),
            replies: ticket.replies.map(reply => ({
                ...reply,
                createdAt: reply.createdAt.toISOString(),
            }))
        })),
        withdrawals: data.withdrawals.map(w => ({
            ...w,
            requestedAt: w.requestedAt.toISOString(),
            processedAt: w.processedAt?.toISOString(),
        })),
        credits: data.credits.map(c => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
        })),
        settings: data.settings,
    };
}

// Helper to deserialize data after reading from JSON
function deserializeData(data: any): MockDb {
    return {
        users: data.users.map((user: any) => ({
            ...user,
            subscriptionExpiry: user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : undefined,
            payoutRate: user.payoutRate ?? 0.8, // Add fallback for old data
        })),
        songs: data.songs.map((song: any) => ({
            ...song,
            submittedAt: new Date(song.submittedAt),
            actionedAt: song.actionedAt ? new Date(song.actionedAt) : undefined,
            totalEarnings: song.totalEarnings ?? 0, // Add fallback for old data
        })),
        tickets: (data.tickets || []).map((ticket: any) => ({
            ...ticket,
            submittedAt: new Date(ticket.submittedAt),
            replies: (ticket.replies || []).map((reply: any) => ({
                ...reply,
                createdAt: new Date(reply.createdAt)
            }))
        })),
        withdrawals: (data.withdrawals || []).map((w: any) => ({
            ...w,
            requestedAt: new Date(w.requestedAt),
            processedAt: w.processedAt ? new Date(w.processedAt) : undefined,
        })),
        credits: (data.credits || []).map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt),
        })),
        settings: data.settings,
    };
}

export function getDb(): MockDb {
    try {
        if (fs.existsSync(dbPath)) {
            const jsonString = fs.readFileSync(dbPath, 'utf-8');
            if (jsonString) {
                const data = JSON.parse(jsonString);
                 if (!data.tickets) data.tickets = [];
                 if (!data.withdrawals) data.withdrawals = [];
                 if (!data.credits) data.credits = [];
                 if (!data.settings) data.settings = initialSettings;
                return deserializeData(data);
            }
        }
    } catch (error) {
        console.error("Error reading db.json, falling back to initial data.", error);
    }
    
    // If file doesn't exist, is empty, or is corrupt, start with initial data and create the file.
    const initialDbState: MockDb = {
        users: initialUsers,
        songs: initialSongs,
        tickets: [],
        withdrawals: [],
        credits: [],
        settings: initialSettings,
    };
    fs.writeFileSync(dbPath, JSON.stringify(serializeData(initialDbState), null, 2), 'utf-8');
    return initialDbState;
}


// This function should be called by any server action that modifies the data.
export function persistData(data: MockDb) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(serializeData(data), null, 2), 'utf-8');
    } catch (error) {
        console.error("Failed to write to db.json", error);
    }
}
