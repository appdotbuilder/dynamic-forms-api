
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // Check if user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .limit(1)
      .execute();

    if (existingUser.length === 0) {
      throw new Error('User not found');
    }

    // Prepare update data
    const updateData: Partial<typeof usersTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    if (input.role !== undefined) {
      updateData.role = input.role;
    }

    // Update user
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};
