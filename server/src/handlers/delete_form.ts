
import { db } from '../db';
import { formsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type IdParam } from '../schema';

export const deleteForm = async (params: IdParam): Promise<{ success: boolean }> => {
  try {
    // Check if form exists
    const existingForm = await db.select()
      .from(formsTable)
      .where(eq(formsTable.id, params.id))
      .execute();

    if (existingForm.length === 0) {
      throw new Error('Form not found');
    }

    // Delete the form
    await db.delete(formsTable)
      .where(eq(formsTable.id, params.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Form deletion failed:', error);
    throw error;
  }
};
