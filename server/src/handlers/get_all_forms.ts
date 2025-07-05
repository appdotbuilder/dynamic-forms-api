
import { db } from '../db';
import { formsTable } from '../db/schema';
import { type Form } from '../schema';

export const getAllForms = async (): Promise<Form[]> => {
  try {
    const results = await db.select()
      .from(formsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get all forms:', error);
    throw error;
  }
};
