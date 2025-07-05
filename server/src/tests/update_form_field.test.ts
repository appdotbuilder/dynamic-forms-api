
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, formsTable, formFieldsTable } from '../db/schema';
import { type UpdateFormFieldInput } from '../schema';
import { updateFormField } from '../handlers/update_form_field';
import { eq } from 'drizzle-orm';

describe('updateFormField', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testFormId: number;
  let testFieldId: number;

  beforeEach(async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'manager'
      })
      .returning()
      .execute();
    testUserId = user[0].id;

    // Create test form
    const form = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'A test form',
        created_by_user_id: testUserId,
        is_active: true
      })
      .returning()
      .execute();
    testFormId = form[0].id;

    // Create test form field
    const field = await db.insert(formFieldsTable)
      .values({
        form_id: testFormId,
        field_name: 'Original Field',
        field_type: 'text',
        is_required: false,
        order: 1,
        options: null,
        placeholder: 'Original placeholder'
      })
      .returning()
      .execute();
    testFieldId = field[0].id;
  });

  it('should update a form field with all fields', async () => {
    const input: UpdateFormFieldInput = {
      id: testFieldId,
      form_id: testFormId,
      field_name: 'Updated Field',
      field_type: 'textarea',
      is_required: true,
      order: 2,
      options: [{ value: 'option1', label: 'Option 1' }],
      placeholder: 'Updated placeholder'
    };

    const result = await updateFormField(input);

    expect(result.id).toEqual(testFieldId);
    expect(result.form_id).toEqual(testFormId);
    expect(result.field_name).toEqual('Updated Field');
    expect(result.field_type).toEqual('textarea');
    expect(result.is_required).toEqual(true);
    expect(result.order).toEqual(2);
    expect(result.options).toEqual([{ value: 'option1', label: 'Option 1' }]);
    expect(result.placeholder).toEqual('Updated placeholder');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const input: UpdateFormFieldInput = {
      id: testFieldId,
      form_id: testFormId,
      field_name: 'Partially Updated Field',
      is_required: true
    };

    const result = await updateFormField(input);

    expect(result.field_name).toEqual('Partially Updated Field');
    expect(result.is_required).toEqual(true);
    expect(result.field_type).toEqual('text'); // Should remain unchanged
    expect(result.order).toEqual(1); // Should remain unchanged
    expect(result.placeholder).toEqual('Original placeholder'); // Should remain unchanged
  });

  it('should save changes to database', async () => {
    const input: UpdateFormFieldInput = {
      id: testFieldId,
      form_id: testFormId,
      field_name: 'Database Test Field',
      field_type: 'number'
    };

    await updateFormField(input);

    const fields = await db.select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.id, testFieldId))
      .execute();

    expect(fields).toHaveLength(1);
    expect(fields[0].field_name).toEqual('Database Test Field');
    expect(fields[0].field_type).toEqual('number');
  });

  it('should throw error if form field does not exist', async () => {
    const input: UpdateFormFieldInput = {
      id: 99999,
      form_id: testFormId,
      field_name: 'Non-existent Field'
    };

    await expect(updateFormField(input)).rejects.toThrow(/form field not found/i);
  });

  it('should throw error if form does not exist when updating form_id', async () => {
    const input: UpdateFormFieldInput = {
      id: testFieldId,
      form_id: 99999,
      field_name: 'Test Field'
    };

    await expect(updateFormField(input)).rejects.toThrow(/form not found/i);
  });

  it('should update field options correctly', async () => {
    const options = [
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' }
    ];

    const input: UpdateFormFieldInput = {
      id: testFieldId,
      form_id: testFormId,
      field_type: 'select',
      options: options
    };

    const result = await updateFormField(input);

    expect(result.field_type).toEqual('select');
    expect(result.options).toEqual(options);
  });

  it('should handle null options', async () => {
    const input: UpdateFormFieldInput = {
      id: testFieldId,
      form_id: testFormId,
      field_type: 'text',
      options: null
    };

    const result = await updateFormField(input);

    expect(result.field_type).toEqual('text');
    expect(result.options).toBeNull();
  });
});
