'use client';

import type { User } from './types';

// login function has been moved to a server action in src/app/login/actions.ts
// changePassword function has been moved into the server action in src/app/dashboard/actions.ts

export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser');
  }
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const userJson = localStorage.getItem('currentUser');
  if (!userJson) {
    return null;
  }
  try {
    return JSON.parse(userJson) as User;
  } catch (e) {
    return null;
  }
};

export const isAdmin = (user: User | null): boolean => {
    if (!user) return false;
    return user.role === 'Admin' || user.role === 'Super Admin';
};

export const isSuperAdmin = (user: User | null): boolean => {
    if (!user) return false;
    return user.role === 'Super Admin';
};
