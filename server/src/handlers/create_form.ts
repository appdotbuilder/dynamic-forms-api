
import { db } from '../db';
import { formsTable } from '../db/schema';
import { type CreateFormInput, type Form } from '../schema';

export const createForm = async (input: CreateFormInput, createdByUserId: number): Promise<Form> => {
  try {
    // Insert form record
    const result = await db.insert(formsTable)
      .values({
        name: input.name,
        description: input.description || null,
        created_by_user_id: createdByUserId,
        is_active: input.is_active ?? true
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Form creation failed:', error);
    throw error;
  }
};
