
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { formFieldsTable, formsTable, usersTable } from '../db/schema';
import { type CreateFormFieldInput } from '../schema';
import { createFormField } from '../handlers/create_form_field';
import { eq } from 'drizzle-orm';

describe('createFormField', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a form field', async () => {
    // Create prerequisite user and form
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
        description: 'A test form',
        created_by_user_id: user[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const testInput: CreateFormFieldInput = {
      form_id: form[0].id,
      field_name: 'email',
      field_type: 'text',
      is_required: true,
      order: 1,
      options: null,
      placeholder: 'Enter your email'
    };

    const result = await createFormField(testInput);

    // Basic field validation
    expect(result.form_id).toEqual(form[0].id);
    expect(result.field_name).toEqual('email');
    expect(result.field_type).toEqual('text');
    expect(result.is_required).toEqual(true);
    expect(result.order).toEqual(1);
    expect(result.options).toBeNull();
    expect(result.placeholder).toEqual('Enter your email');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save form field to database', async () => {
    // Create prerequisite user and form
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
        description: 'A test form',
        created_by_user_id: user[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const testInput: CreateFormFieldInput = {
      form_id: form[0].id,
      field_name: 'age',
      field_type: 'number',
      is_required: false,
      order: 2,
      options: null,
      placeholder: 'Enter your age'
    };

    const result = await createFormField(testInput);

    // Query using proper drizzle syntax
    const formFields = await db.select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.id, result.id))
      .execute();

    expect(formFields).toHaveLength(1);
    expect(formFields[0].form_id).toEqual(form[0].id);
    expect(formFields[0].field_name).toEqual('age');
    expect(formFields[0].field_type).toEqual('number');
    expect(formFields[0].is_required).toEqual(false);
    expect(formFields[0].order).toEqual(2);
    expect(formFields[0].options).toBeNull();
    expect(formFields[0].placeholder).toEqual('Enter your age');
    expect(formFields[0].created_at).toBeInstanceOf(Date);
    expect(formFields[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create form field with options for select type', async () => {
    // Create prerequisite user and form
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
        description: 'A test form',
        created_by_user_id: user[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const testInput: CreateFormFieldInput = {
      form_id: form[0].id,
      field_name: 'country',
      field_type: 'select',
      is_required: true,
      order: 3,
      options: [
        { value: 'us', label: 'United States' },
        { value: 'ca', label: 'Canada' },
        { value: 'uk', label: 'United Kingdom' }
      ],
      placeholder: 'Select your country'
    };

    const result = await createFormField(testInput);

    expect(result.options).toEqual([
      { value: 'us', label: 'United States' },
      { value: 'ca', label: 'Canada' },
      { value: 'uk', label: 'United Kingdom' }
    ]);
  });

  it('should apply default values correctly', async () => {
    // Create prerequisite user and form
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
        description: 'A test form',
        created_by_user_id: user[0].id,
        is_active: true
      })
      .returning()
      .execute();

    const testInput: CreateFormFieldInput = {
      form_id: form[0].id,
      field_name: 'description',
      field_type: 'textarea',
      order: 4
      // Omitting optional fields to test defaults
    };

    const result = await createFormField(testInput);

    expect(result.is_required).toEqual(false);
    expect(result.options).toBeNull();
    expect(result.placeholder).toBeNull();
  });

  it('should throw error when form does not exist', async () => {
    const testInput: CreateFormFieldInput = {
      form_id: 999, // Non-existent form ID
      field_name: 'test_field',
      field_type: 'text',
      is_required: false,
      order: 1,
      options: null,
      placeholder: null
    };

    await expect(createFormField(testInput)).rejects.toThrow(/form not found/i);
  });
});
