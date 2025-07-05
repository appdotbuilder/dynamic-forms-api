
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { formsTable, usersTable } from '../db/schema';
import { type IdParam } from '../schema';
import { deleteForm } from '../handlers/delete_form';
import { eq } from 'drizzle-orm';

describe('deleteForm', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a form', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'testuser@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
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

    // Delete the form
    const result = await deleteForm({ id: formId });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify form is no longer in database
    const forms = await db.select()
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .execute();

    expect(forms).toHaveLength(0);
  });

  it('should throw error when form does not exist', async () => {
    const nonExistentId = 9999;

    await expect(deleteForm({ id: nonExistentId }))
      .rejects
      .toThrow(/Form not found/i);
  });

  it('should handle database errors', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'testuser@example.com',
        password_hash: 'hashedpassword',
        role: 'admin'
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

    // Delete the form once
    await deleteForm({ id: formId });

    // Try to delete again - should fail
    await expect(deleteForm({ id: formId }))
      .rejects
      .toThrow(/Form not found/i);
  });
});
