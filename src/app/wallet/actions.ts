
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getDb, persistData } from '@/lib/data';
import type { Withdrawal, UnifiedTransaction, Credit } from '@/lib/types';

// This is a helper function that can be used by other server actions too.
// It is not directly callable from the client.
export async function calculateWalletSummary(userId: string) {
    const db = getDb();
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");

    const userSongs = db.songs.filter(s => s.userId === userId && s.status === 'Approved');
    const userWithdrawals = db.withdrawals.filter(w => w.userId === userId);
    const userCredits = db.credits.filter(c => c.userId === userId);

    const songEarnings = userSongs.reduce((acc, song) => {
        return acc + ((song.totalEarnings || 0) * user.payoutRate);
    }, 0);

    const totalCredits = userCredits.reduce((acc, credit) => acc + credit.amount, 0);

    const totalEarnings = songEarnings + totalCredits;

    const totalWithdrawn = userWithdrawals
        .filter(w => w.status === 'Completed')
        .reduce((acc, w) => acc + w.amount, 0);
    
    const pendingWithdrawals = userWithdrawals
        .filter(w => w.status === 'Pending')
        .reduce((acc, w) => acc + w.amount, 0);
        
    const availableBalance = totalEarnings - totalWithdrawn - pendingWithdrawals;
    
    const getAdminName = (adminId: string) => db.users.find(u => u.id === adminId)?.name || 'An Admin';

    const transactions: UnifiedTransaction[] = [
        ...userWithdrawals.map((w): UnifiedTransaction => ({ 
            ...w, 
            type: 'withdrawal',
            adminName: w.processedBy ? getAdminName(w.processedBy) : undefined
        })),
        ...userCredits.map((c): UnifiedTransaction => ({ 
            ...c, 
            type: 'credit', 
            adminName: getAdminName(c.adminId) 
        }))
    ].sort((a, b) => {
        const dateA = a.type === 'withdrawal' ? a.requestedAt : a.createdAt;
        const dateB = b.type === 'withdrawal' ? b.requestedAt : b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });


    return {
        totalEarnings,
        totalWithdrawn,
        availableBalance,
        transactions,
    };
}


const withdrawalSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive."),
  upiId: z.string().min(3, "UPI ID is required."),
  upiName: z.string().min(2, "Account name is required."),
});

export async function requestWithdrawalAction(data: z.infer<typeof withdrawalSchema>) {
    const parsed = withdrawalSchema.safeParse(data);
    if (!parsed.success) {
        // This flattens the error messages to be more user-friendly
        const error = parsed.error.flatten().fieldErrors;
        const firstError = Object.values(error)[0]?.[0];
        return { success: false, error: firstError || 'Invalid data provided.' };
    }

    const { userId, amount } = parsed.data;

    const walletData = await calculateWalletSummary(userId);

    if (amount > walletData.availableBalance) {
        return { success: false, error: "Insufficient balance." };
    }
    
    if (amount < 500) { // Minimum withdrawal amount
        return { success: false, error: "Minimum withdrawal amount is ₹500." };
    }

    const newWithdrawal: Withdrawal = {
        id: `wd-${Date.now()}`,
        userId: userId,
        amount: amount,
        upiId: parsed.data.upiId,
        upiName: parsed.data.upiName,
        status: 'Pending',
        requestedAt: new Date(),
    };

    const db = getDb();
    if (!db.withdrawals) {
        db.withdrawals = [];
    }
    db.withdrawals.push(newWithdrawal);
    persistData(db);

    revalidatePath('/wallet');
    revalidatePath('/admin/withdrawals');

    return { success: true, message: 'Withdrawal request submitted successfully!' };
}
