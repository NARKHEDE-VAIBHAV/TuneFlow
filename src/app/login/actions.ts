'use server';

import { getDb } from '@/lib/data';
import type { User } from '@/lib/types';

type AuthResult = {
  success: boolean;
  user?: Omit<User, 'password'>;
  error?: string;
}

export async function loginAction(email: string, password: string): Promise<AuthResult> {
  const db = getDb();
  const user = db.users.find((u) => u.email === email);

  if (!user) {
    return { success: false, error: "An account with this email does not exist." };
  }

  if (user.password !== password) {
    return { success: false, error: "Invalid email or password." };
  }
  
  const userToStore = { ...user };
  delete userToStore.password; // Don't include password in the returned user object

  return { success: true, user: userToStore };
}
