
import { db } from '../db';
import { formsTable } from '../db/schema';
import { type UpdateFormInput, type Form } from '../schema';
import { eq } from 'drizzle-orm';

export const updateForm = async (input: UpdateFormInput): Promise<Form> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof formsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the form
    const result = await db.update(formsTable)
      .set(updateData)
      .where(eq(formsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Form with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Form update failed:', error);
    throw error;
  }
};
