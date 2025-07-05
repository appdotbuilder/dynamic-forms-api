
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type IdParam } from '../schema';

export const deleteUser = async (params: IdParam): Promise<{ success: boolean }> => {
  try {
    // Check if user exists first
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, params.id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error('User not found');
    }

    // Delete the user
    await db.delete(usersTable)
      .where(eq(usersTable.id, params.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};
