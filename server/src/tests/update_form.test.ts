
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { formsTable, usersTable } from '../db/schema';
import { type UpdateFormInput } from '../schema';
import { updateForm } from '../handlers/update_form';
import { eq } from 'drizzle-orm';

describe('updateForm', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let userId: number;
  let formId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'manager'
      })
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test form
    const formResult = await db.insert(formsTable)
      .values({
        name: 'Original Form',
        description: 'Original description',
        created_by_user_id: userId,
        is_active: true
      })
      .returning()
      .execute();
    formId = formResult[0].id;
  });

  it('should update form name', async () => {
    const input: UpdateFormInput = {
      id: formId,
      name: 'Updated Form Name'
    };

    const result = await updateForm(input);

    expect(result.id).toEqual(formId);
    expect(result.name).toEqual('Updated Form Name');
    expect(result.description).toEqual('Original description');
    expect(result.is_active).toEqual(true);
    expect(result.created_by_user_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update form description', async () => {
    const input: UpdateFormInput = {
      id: formId,
      description: 'Updated description'
    };

    const result = await updateForm(input);

    expect(result.id).toEqual(formId);
    expect(result.name).toEqual('Original Form');
    expect(result.description).toEqual('Updated description');
    expect(result.is_active).toEqual(true);
    expect(result.created_by_user_id).toEqual(userId);
  });

  it('should update form active status', async () => {
    const input: UpdateFormInput = {
      id: formId,
      is_active: false
    };

    const result = await updateForm(input);

    expect(result.id).toEqual(formId);
    expect(result.name).toEqual('Original Form');
    expect(result.description).toEqual('Original description');
    expect(result.is_active).toEqual(false);
    expect(result.created_by_user_id).toEqual(userId);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateFormInput = {
      id: formId,
      name: 'Completely Updated Form',
      description: 'New description',
      is_active: false
    };

    const result = await updateForm(input);

    expect(result.id).toEqual(formId);
    expect(result.name).toEqual('Completely Updated Form');
    expect(result.description).toEqual('New description');
    expect(result.is_active).toEqual(false);
    expect(result.created_by_user_id).toEqual(userId);
  });

  it('should set description to null when explicitly provided', async () => {
    const input: UpdateFormInput = {
      id: formId,
      description: null
    };

    const result = await updateForm(input);

    expect(result.id).toEqual(formId);
    expect(result.name).toEqual('Original Form');
    expect(result.description).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.created_by_user_id).toEqual(userId);
  });

  it('should save changes to database', async () => {
    const input: UpdateFormInput = {
      id: formId,
      name: 'Database Updated Form',
      is_active: false
    };

    await updateForm(input);

    // Verify changes were saved
    const forms = await db.select()
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .execute();

    expect(forms).toHaveLength(1);
    expect(forms[0].name).toEqual('Database Updated Form');
    expect(forms[0].is_active).toEqual(false);
    expect(forms[0].description).toEqual('Original description');
  });

  it('should throw error for non-existent form', async () => {
    const input: UpdateFormInput = {
      id: 99999,
      name: 'Non-existent Form'
    };

    await expect(updateForm(input)).rejects.toThrow(/Form with id 99999 not found/i);
  });

  it('should update timestamp when form is updated', async () => {
    const originalForm = await db.select()
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .execute();

    const originalUpdatedAt = originalForm[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateFormInput = {
      id: formId,
      name: 'Timestamp Test Form'
    };

    const result = await updateForm(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
