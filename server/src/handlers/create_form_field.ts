
import { db } from '../db';
import { formFieldsTable, formsTable } from '../db/schema';
import { type CreateFormFieldInput, type FormField } from '../schema';
import { eq } from 'drizzle-orm';

export const createFormField = async (input: CreateFormFieldInput): Promise<FormField> => {
  try {
    // Verify the form exists
    const form = await db.select()
      .from(formsTable)
      .where(eq(formsTable.id, input.form_id))
      .execute();

    if (form.length === 0) {
      throw new Error('Form not found');
    }

    // Insert form field record
    const result = await db.insert(formFieldsTable)
      .values({
        form_id: input.form_id,
        field_name: input.field_name,
        field_type: input.field_type,
        is_required: input.is_required ?? false,
        order: input.order,
        options: input.options || null,
        placeholder: input.placeholder || null
      })
      .returning()
      .execute();

    const formField = result[0];
    
    // Type cast the options field to match the expected type
    return {
      ...formField,
      options: formField.options as { value: string; label: string; }[] | null
    };
  } catch (error) {
    console.error('Form field creation failed:', error);
    throw error;
  }
};
