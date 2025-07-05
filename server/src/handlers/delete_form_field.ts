
import { db } from '../db';
import { formFieldsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteFormField = async (params: IdParam): Promise<{ success: boolean }> => {
  try {
    // Delete the form field by ID
    const result = await db.delete(formFieldsTable)
      .where(eq(formFieldsTable.id, params.id))
      .returning()
      .execute();

    // Check if a field was actually deleted
    if (result.length === 0) {
      throw new Error('Form field not found');
    }

    return { success: true };
  } catch (error) {
    console.error('Form field deletion failed:', error);
    throw error;
  }
};
