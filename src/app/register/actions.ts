'use server';

import { z } from 'zod';
import { getDb, persistData } from '@/lib/data';
import type { User } from '@/lib/types';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type AuthResult = {
  success: boolean;
  user?: Omit<User, 'password'>;
  error?: string;
}

export async function registerAction(data: z.infer<typeof registerSchema>): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid data provided." };
  }

  const { name, email, password } = parsed.data;

  const db = getDb();
  const existingUser = db.users.find((u) => u.email === email);
  if (existingUser) {
    return { success: false, error: "An account with this email already exists." };
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    avatar: `https://i.pravatar.cc/150?u=${email}`,
    password,
    role: 'User',
    accountType: 'Normal Artist',
    subscriptionExpiry: undefined,
    payoutRate: 0.8, // Default 80% payout rate
  };
  
  db.users.push(newUser);
  persistData(db); // Persist the new user to the file system

  // Return the new user object so the client can log them in
  const userToStore = { ...newUser };
  delete userToStore.password;

  return { success: true, user: userToStore };
}
