'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getDb, persistData } from '@/lib/data';
import type { Ticket } from '@/lib/types';

const newTicketSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  subject: z.string().min(3, 'Subject must be at least 3 characters long'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

export async function createTicketAction(data: z.infer<typeof newTicketSchema>) {
  const parsed = newTicketSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data provided.' };
  }
  
  const { userId, subject, message } = parsed.data;

  const newTicket: Ticket = {
    id: `ticket-${Date.now()}`,
    userId,
    subject,
    message,
    status: 'Open',
    submittedAt: new Date(),
    replies: [],
    photoUrl: "https://placehold.co/400x300.png"
    // For now, photoUrl is just a placeholder. A real app would need file storage.
  };

  const db = getDb();
  if (!db.tickets) {
    db.tickets = [];
  }
  db.tickets.unshift(newTicket);
  persistData(db);

  revalidatePath('/support');
  revalidatePath('/admin/support');

  return { success: true, message: 'Your ticket has been submitted!' };
}

export async function getTicketsForUser(userId: string): Promise<Ticket[]> {
  const db = getDb();
  return (db.tickets || []).filter(ticket => ticket.userId === userId);
}
