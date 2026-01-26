/**
 * In-memory user store for MVP
 * TODO: Migrate to Supabase
 */

export interface StoredUser {
  id: string;
  name: string;
  phone: string;
  birthyear: string;
  gender: 'male' | 'female';
  provider: 'local' | 'kakao';
  passwordHash?: string; // Only for local users
  createdAt: string;
}

// In-memory storage (will be lost on server restart)
// TODO: Replace with Supabase when ready
const users: Map<string, StoredUser> = new Map();

export function findUserByPhone(phone: string): StoredUser | undefined {
  for (const user of users.values()) {
    if (user.phone === phone) {
      return user;
    }
  }
  return undefined;
}

export function findUserById(id: string): StoredUser | undefined {
  return users.get(id);
}

export function createUser(user: StoredUser): StoredUser {
  users.set(user.id, user);
  return user;
}

export function updateUser(id: string, updates: Partial<StoredUser>): StoredUser | undefined {
  const user = users.get(id);
  if (!user) return undefined;

  const updatedUser = { ...user, ...updates };
  users.set(id, updatedUser);
  return updatedUser;
}

// For debugging (remove in production)
export function getAllUsers(): StoredUser[] {
  return Array.from(users.values());
}
