
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export const getCurrentUser = async (userId: number): Promise<User> => {
  try {
    // Query user by ID
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (result.length === 0) {
      throw new Error('User not found');
    }

    const user = result[0];
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Get current user failed:', error);
    throw error;
  }
};
