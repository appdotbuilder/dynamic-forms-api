
import { db } from '../db';
import { formFieldsTable, formsTable } from '../db/schema';
import { type UpdateFormFieldInput, type FormField } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFormField = async (input: UpdateFormFieldInput): Promise<FormField> => {
  try {
    // Verify the form field exists
    const existingField = await db.select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.id, input.id))
      .execute();

    if (existingField.length === 0) {
      throw new Error('Form field not found');
    }

    // Verify the form exists if form_id is being updated
    if (input.form_id) {
      const form = await db.select()
        .from(formsTable)
        .where(eq(formsTable.id, input.form_id))
        .execute();

      if (form.length === 0) {
        throw new Error('Form not found');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.field_name !== undefined) {
      updateData.field_name = input.field_name;
    }

    if (input.field_type !== undefined) {
      updateData.field_type = input.field_type;
    }

    if (input.is_required !== undefined) {
      updateData.is_required = input.is_required;
    }

    if (input.order !== undefined) {
      updateData.order = input.order;
    }

    if (input.options !== undefined) {
      updateData.options = input.options;
    }

    if (input.placeholder !== undefined) {
      updateData.placeholder = input.placeholder;
    }

    // Update the form field
    const result = await db.update(formFieldsTable)
      .set(updateData)
      .where(eq(formFieldsTable.id, input.id))
      .returning()
      .execute();

    // Convert the result to match the FormField schema
    const updatedField = result[0];
    return {
      id: updatedField.id,
      form_id: updatedField.form_id,
      field_name: updatedField.field_name,
      field_type: updatedField.field_type,
      is_required: updatedField.is_required,
      order: updatedField.order,
      options: updatedField.options as { value: string; label: string; }[] | null,
      placeholder: updatedField.placeholder,
      created_at: updatedField.created_at,
      updated_at: updatedField.updated_at
    };
  } catch (error) {
    console.error('Form field update failed:', error);
    throw error;
  }
};
