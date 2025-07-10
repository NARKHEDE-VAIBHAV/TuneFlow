'use server';

import { z } from 'zod';
import { getDb, persistData } from '@/lib/data';

const changePasswordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long.'),
});

export async function changePasswordAction(data: z.infer<typeof changePasswordSchema>) {
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid data provided." };
  }

  const { userId, currentPassword, newPassword } = parsed.data;

  const db = getDb();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    return { success: false, error: "User not found." };
  }

  if (user.password !== currentPassword) {
    return { success: false, error: "Incorrect current password." };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters long." };
  }

  // In a real app, you would save the new hashed password.
  user.password = newPassword;
  
  persistData(db); // Save the password change
  return { success: true, message: "Password updated successfully!" };
}
