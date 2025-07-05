
import { db } from '../db';
import { formsTable, formFieldsTable } from '../db/schema';
import { type IdParam, type FormWithFields, type FieldOption } from '../schema';
import { eq } from 'drizzle-orm';

export const getFormById = async (params: IdParam): Promise<FormWithFields> => {
  try {
    // Fetch form with its fields using a join
    const results = await db.select()
      .from(formsTable)
      .leftJoin(formFieldsTable, eq(formsTable.id, formFieldsTable.form_id))
      .where(eq(formsTable.id, params.id))
      .execute();

    if (results.length === 0) {
      throw new Error(`Form with id ${params.id} not found`);
    }

    // Get the form data from the first result
    const formData = results[0].forms;
    
    // Collect all fields, filtering out null entries from left join
    const fields = results
      .map(result => result.form_fields)
      .filter(field => field !== null)
      .map(field => ({
        ...field,
        options: field.options as FieldOption[] | null // Type assertion for options
      }))
      .sort((a, b) => a.order - b.order); // Sort by order field

    return {
      ...formData,
      fields
    };
  } catch (error) {
    console.error('Get form by ID failed:', error);
    throw error;
  }
};
