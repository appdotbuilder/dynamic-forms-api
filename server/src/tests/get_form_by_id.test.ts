
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, formsTable, formFieldsTable } from '../db/schema';
import { type IdParam } from '../schema';
import { getFormById } from '../handlers/get_form_by_id';

describe('getFormById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a form by id with its fields', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a test form
    const formResult = await db.insert(formsTable)
      .values({
        name: 'Test Form',
        description: 'A test form',
        created_by_user_id: userId,
        is_active: true
      })
      .returning()
      .execute();

    const formId = formResult[0].id;

    // Create test form fields
    await db.insert(formFieldsTable)
      .values([
        {
          form_id: formId,
          field_name: 'Email',
          field_type: 'text',
          is_required: true,
          order: 1,
          placeholder: 'Enter your email'
        },
        {
          form_id: formId,
          field_name: 'Age',
          field_type: 'number',
          is_required: false,
          order: 2,
          placeholder: 'Enter your age'
        }
      ])
      .execute();

    const input: IdParam = { id: formId };
    const result = await getFormById(input);

    // Verify form data
    expect(result.id).toEqual(formId);
    expect(result.name).toEqual('Test Form');
    expect(result.description).toEqual('A test form');
    expect(result.created_by_user_id).toEqual(userId);
    expect(result.is_active).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify fields are included and ordered correctly
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0].field_name).toEqual('Email');
    expect(result.fields[0].field_type).toEqual('text');
    expect(result.fields[0].is_required).toEqual(true);
    expect(result.fields[0].order).toEqual(1);
    expect(result.fields[0].placeholder).toEqual('Enter your email');

    expect(result.fields[1].field_name).toEqual('Age');
    expect(result.fields[1].field_type).toEqual('number');
    expect(result.fields[1].is_required).toEqual(false);
    expect(result.fields[1].order).toEqual(2);
    expect(result.fields[1].placeholder).toEqual('Enter your age');
  });

  it('should return form with empty fields array when form has no fields', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a test form without fields
    const formResult = await db.insert(formsTable)
      .values({
        name: 'Empty Form',
        description: 'A form with no fields',
        created_by_user_id: userId,
        is_active: true
      })
      .returning()
      .execute();

    const formId = formResult[0].id;

    const input: IdParam = { id: formId };
    const result = await getFormById(input);

    expect(result.id).toEqual(formId);
    expect(result.name).toEqual('Empty Form');
    expect(result.fields).toHaveLength(0);
  });

  it('should throw error when form does not exist', async () => {
    const input: IdParam = { id: 999 };
    
    await expect(getFormById(input)).rejects.toThrow(/Form with id 999 not found/i);
  });

  it('should sort fields by order', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a test form
    const formResult = await db.insert(formsTable)
      .values({
        name: 'Ordered Form',
        description: 'A form with ordered fields',
        created_by_user_id: userId,
        is_active: true
      })
      .returning()
      .execute();

    const formId = formResult[0].id;

    // Create test form fields in reverse order
    await db.insert(formFieldsTable)
      .values([
        {
          form_id: formId,
          field_name: 'Third Field',
          field_type: 'text',
          is_required: false,
          order: 3
        },
        {
          form_id: formId,
          field_name: 'First Field',
          field_type: 'text',
          is_required: true,
          order: 1
        },
        {
          form_id: formId,
          field_name: 'Second Field',
          field_type: 'number',
          is_required: false,
          order: 2
        }
      ])
      .execute();

    const input: IdParam = { id: formId };
    const result = await getFormById(input);

    expect(result.fields).toHaveLength(3);
    expect(result.fields[0].field_name).toEqual('First Field');
    expect(result.fields[0].order).toEqual(1);
    expect(result.fields[1].field_name).toEqual('Second Field');
    expect(result.fields[1].order).toEqual(2);
    expect(result.fields[2].field_name).toEqual('Third Field');
    expect(result.fields[2].order).toEqual(3);
  });

  it('should handle fields with options correctly', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a test form
    const formResult = await db.insert(formsTable)
      .values({
        name: 'Form with Options',
        description: 'A form with select field',
        created_by_user_id: userId,
        is_active: true
      })
      .returning()
      .execute();

    const formId = formResult[0].id;

    // Create test form field with options
    const selectOptions = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];

    await db.insert(formFieldsTable)
      .values({
        form_id: formId,
        field_name: 'Choice',
        field_type: 'select',
        is_required: true,
        order: 1,
        options: selectOptions
      })
      .execute();

    const input: IdParam = { id: formId };
    const result = await getFormById(input);

    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].field_name).toEqual('Choice');
    expect(result.fields[0].field_type).toEqual('select');
    expect(result.fields[0].options).toEqual(selectOptions);
  });
});
