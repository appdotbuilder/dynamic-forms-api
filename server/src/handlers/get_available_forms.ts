
import { db } from '../db';
import { formsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Form } from '../schema';

export const getAvailableForms = async (): Promise<Form[]> => {
  try {
    // Fetch all active forms
    const results = await db.select()
      .from(formsTable)
      .where(eq(formsTable.is_active, true))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch available forms:', error);
    throw error;
  }
};
