'use server';

import { revalidatePath } from 'next/cache';
import { getDb, persistData } from '@/lib/data';
import type { TicketReply, User, PriceSettings, Withdrawal, Credit } from '@/lib/types';

export async function approveSongAction(songId: string, adminId: string) {
  try {
    const db = getDb();
    const songIndex = db.songs.findIndex((song) => song.id === songId);
    if (songIndex === -1) {
      return { success: false, error: 'Song not found.' };
    }
    db.songs[songIndex].status = 'Approved';
    db.songs[songIndex].actionedBy = adminId;
    db.songs[songIndex].actionedAt = new Date();
    persistData(db);
    
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/approved-songs');
    revalidatePath('/dashboard');
    
    return { success: true, message: 'Song approved.' };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function declineSongAction(songId: string, adminId: string) {
  try {
    const db = getDb();
    const songIndex = db.songs.findIndex((song) => song.id === songId);
    if (songIndex === -1) {
      return { success: false, error: 'Song not found.' };
    }
    db.songs[songIndex].status = 'Declined';
    db.songs[songIndex].actionedBy = adminId;
    db.songs[songIndex].actionedAt = new Date();
    persistData(db);
    
    revalidatePath('/admin/dashboard');
    revalidatePath('/dashboard');
    
    return { success: true, message: 'Song declined.' };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function replyToTicketAction(ticketId: string, userId: string, message: string) {
  try {
    const db = getDb();
    const ticketIndex = db.tickets.findIndex((ticket) => ticket.id === ticketId);
    if (ticketIndex === -1) {
      return { success: false, error: 'Ticket not found.' };
    }

    const newReply: TicketReply = {
      id: `reply-${Date.now()}`,
      userId,
      message,
      createdAt: new Date(),
    };

    db.tickets[ticketIndex].replies.push(newReply);
    persistData(db);
    
    revalidatePath('/admin/support');
    
    return { success: true, message: 'Reply sent.' };
  } catch (error) {
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function closeTicketAction(ticketId: string) {
    try {
      const db = getDb();
      const ticketIndex = db.tickets.findIndex((ticket) => ticket.id === ticketId);
      if (ticketIndex === -1) {
        return { success: false, error: 'Ticket not found.' };
      }
      db.tickets[ticketIndex].status = 'Closed';
      persistData(db);
      
      revalidatePath('/admin/support');
      
      return { success: true, message: 'Ticket closed.' };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function updateUserRoleAction(userId: string, role: User['role']) {
    // In a real app, you would verify the caller's role here by looking them up in the DB.
    try {
        const db = getDb();
        const userIndex = db.users.findIndex((user) => user.id === userId);
        if (userIndex === -1) {
            return { success: false, error: 'User not found.' };
        }
        db.users[userIndex].role = role;
        persistData(db);
        revalidatePath('/admin/users');
        return { success: true, message: `User role updated to ${role}.` };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function updateUserAccountTypeAction(userId: string, accountType: User['accountType']) {
    try {
        const db = getDb();
        const userIndex = db.users.findIndex((user) => user.id === userId);
        if (userIndex === -1) {
            return { success: false, error: 'User not found.' };
        }
        db.users[userIndex].accountType = accountType;
        persistData(db);
        revalidatePath('/admin/users');
        return { success: true, message: `User account type updated to ${accountType}.` };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function grantSubscriptionAction(userId: string, months: number) {
    try {
        const db = getDb();
        const userIndex = db.users.findIndex((user) => user.id === userId);
        if (userIndex === -1) {
            return { success: false, error: 'User not found.' };
        }
        
        const now = new Date();
        const user = db.users[userIndex];
        
        // If user has an active subscription, extend it from the expiry date. Otherwise, start from today.
        const startDate = (user.subscriptionExpiry && new Date(user.subscriptionExpiry) > now)
            ? new Date(user.subscriptionExpiry)
            : now;

        const newExpiryDate = new Date(startDate);
        newExpiryDate.setMonth(newExpiryDate.getMonth() + months);

        db.users[userIndex].subscriptionExpiry = newExpiryDate;
        persistData(db);
        revalidatePath('/admin/users');
        
        const durationText = months === 1 ? '1 month' : months === 12 ? '1 year' : `${months} months`;
        return { success: true, message: `Granted ${durationText} of subscription.` };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function revokeSubscriptionAction(userId: string) {
    try {
        const db = getDb();
        const userIndex = db.users.findIndex((user) => user.id === userId);
        if (userIndex === -1) {
            return { success: false, error: 'User not found.' };
        }
        db.users[userIndex].subscriptionExpiry = undefined;
        persistData(db);
        revalidatePath('/admin/users');
        return { success: true, message: 'Subscription has been revoked.' };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred.' };
    }
}


export async function updatePriceSettingsAction(prices: PriceSettings) {
    try {
        const db = getDb();
        db.settings.prices = prices;
        persistData(db);
        revalidatePath('/admin/settings');
        return { success: true, message: 'Price settings updated successfully.' };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function updateUserPayoutRateAction(userId: string, rate: number) {
    try {
        const db = getDb();
        const userIndex = db.users.findIndex((user) => user.id === userId);
        if (userIndex === -1) {
            return { success: false, error: 'User not found.' };
        }
        
        if (rate < 0 || rate > 100) {
            return { success: false, error: 'Payout rate must be between 0 and 100.' };
        }

        db.users[userIndex].payoutRate = rate / 100;
        persistData(db);
        revalidatePath('/admin/users');
        return { success: true, message: 'Payout rate updated.' };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function updateSongEarningsAction(songId: string, earnings: number) {
    try {
        const db = getDb();
        const songIndex = db.songs.findIndex((song) => song.id === songId);
        if (songIndex === -1) {
            return { success: false, error: 'Song not found.' };
        }
        
        if (earnings < 0) {
            return { success: false, error: 'Earnings must be a positive number.' };
        }

        db.songs[songIndex].totalEarnings = earnings;
        persistData(db);
        revalidatePath('/admin/approved-songs');
        revalidatePath('/dashboard');
        revalidatePath('/wallet');
        return { success: true, message: 'Song earnings updated.' };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function updateWithdrawalStatusAction(withdrawalId: string, adminId: string, status: Withdrawal['status']) {
    try {
        const db = getDb();
        const withdrawalIndex = db.withdrawals.findIndex(w => w.id === withdrawalId);
        if (withdrawalIndex === -1) {
            return { success: false, error: 'Withdrawal request not found.' };
        }

        db.withdrawals[withdrawalIndex].status = status;
        db.withdrawals[withdrawalIndex].processedAt = new Date();
        db.withdrawals[withdrawalIndex].processedBy = adminId;
        persistData(db);

        revalidatePath('/admin/withdrawals');
        revalidatePath('/wallet'); // Revalidate user's wallet too

        return { success: true, message: `Withdrawal status updated to ${status}.` };

    } catch (error) {
        console.error(error);
        return { success: false, error: 'An unexpected error occurred.' };
    }
}

export async function addCreditAction(userId: string, adminId: string, amount: number, note: string) {
    try {
        const db = getDb();
        const user = db.users.find(u => u.id === userId);
        if (!user) {
            return { success: false, error: "User not found." };
        }

        if (amount <= 0) {
            return { success: false, error: "Credit amount must be positive."};
        }
        
        const newCredit: Credit = {
            id: `credit-${Date.now()}`,
            userId,
            adminId,
            amount,
            note,
            createdAt: new Date(),
        };

        db.credits.unshift(newCredit);
        persistData(db);
        
        revalidatePath('/wallet');
        revalidatePath('/admin/users');

        return { success: true, message: `Successfully credited ₹${amount} to ${user.name}.` };
    } catch (error) {
        return { success: false, error: 'An unexpected error occurred.' };
    }
}
