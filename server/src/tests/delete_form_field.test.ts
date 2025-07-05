
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, formsTable, formFieldsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { deleteFormField } from '../handlers/delete_form_field';
import { eq } from 'drizzle-orm';

describe('deleteFormField', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a form field', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const form = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'Test form description',
        created_by_user_id: user[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const formField = await db.insert(formFieldsTable)
      .values({
        form_id: form[0].id,
        field_name: 'test_field',
        field_type: 'text',
        is_required: true,
        order: 1,
        options: null,
        placeholder: 'Enter text'
      })
      .returning()
      .execute();

    const params: IdParam = {
      id: formField[0].id
    };

    const result = await deleteFormField(params);

    expect(result.success).toBe(true);
  });

  it('should remove form field from database', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'manager'
      })
      .returning()
      .execute();

    const form = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'Test form description',
        created_by_user_id: user[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const formField = await db.insert(formFieldsTable)
      .values({
        form_id: form[0].id,
        field_name: 'test_field',
        field_type: 'select',
        is_required: false,
        order: 2,
        options: [{ value: 'option1', label: 'Option 1' }, { value: 'option2', label: 'Option 2' }],
        placeholder: null
      })
      .returning()
      .execute();

    const params: IdParam = {
      id: formField[0].id
    };

    await deleteFormField(params);

    // Verify field is deleted
    const deletedField = await db.select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.id, formField[0].id))
      .execute();

    expect(deletedField).toHaveLength(0);
  });

  it('should throw error when form field does not exist', async () => {
    const params: IdParam = {
      id: 999999 // Non-existent ID
    };

    await expect(deleteFormField(params)).rejects.toThrow(/form field not found/i);
  });

  it('should handle different field types correctly', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
      })
      .returning()
      .execute();

    const form = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'Test form description',
        created_by_user_id: user[0].id,
        is_active: true
      })
      .returning()
      .execute();

    // Create multiple form fields with different types
    const textField = await db.insert(formFieldsTable)
      .values({
        form_id: form[0].id,
        field_name: 'text_field',
        field_type: 'text',
        is_required: true,
        order: 1,
        options: null,
        placeholder: 'Enter text'
      })
      .returning()
      .execute();

    const numberField = await db.insert(formFieldsTable)
      .values({
        form_id: form[0].id,
        field_name: 'number_field',
        field_type: 'number',
        is_required: false,
        order: 2,
        options: null,
        placeholder: 'Enter number'
      })
      .returning()
      .execute();

    const selectField = await db.insert(formFieldsTable)
      .values({
        form_id: form[0].id,
        field_name: 'select_field',
        field_type: 'select',
        is_required: true,
        order: 3,
        options: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }],
        placeholder: null
      })
      .returning()
      .execute();

    // Delete text field
    await deleteFormField({ id: textField[0].id });

    // Verify only text field is deleted, others remain
    const remainingFields = await db.select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.form_id, form[0].id))
      .execute();

    expect(remainingFields).toHaveLength(2);
    expect(remainingFields.find(f => f.id === textField[0].id)).toBeUndefined();
    expect(remainingFields.find(f => f.id === numberField[0].id)).toBeDefined();
    expect(remainingFields.find(f => f.id === selectField[0].id)).toBeDefined();
  });
});
