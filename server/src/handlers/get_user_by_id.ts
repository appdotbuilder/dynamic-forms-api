
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type IdParam, type User } from '../schema';

export const getUserById = async (params: IdParam): Promise<User> => {
  try {
    const result = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, params.id))
      .execute();

    if (result.length === 0) {
      throw new Error(`User with ID ${params.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get user by ID:', error);
    throw error;
  }
};
