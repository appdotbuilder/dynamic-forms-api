
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { formsTable, usersTable } from '../db/schema';
import { getAllForms } from '../handlers/get_all_forms';

describe('getAllForms', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no forms exist', async () => {
    const result = await getAllForms();
    expect(result).toEqual([]);
  });

  it('should return all forms when forms exist', async () => {
    // Create a test user first (required for form creation)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test forms
    await db.insert(formsTable)
      .values([
        {
          name: 'Test Form 1',
          description: 'First test form',
          created_by_user_id: userId,
          is_active: true
        },
        {
          name: 'Test Form 2',
          description: 'Second test form',
          created_by_user_id: userId,
          is_active: false
        },
        {
          name: 'Test Form 3',
          description: null,
          created_by_user_id: userId,
          is_active: true
        }
      ])
      .execute();

    const result = await getAllForms();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Test Form 1');
    expect(result[0].description).toEqual('First test form');
    expect(result[0].is_active).toEqual(true);
    expect(result[0].created_by_user_id).toEqual(userId);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Test Form 2');
    expect(result[1].is_active).toEqual(false);

    expect(result[2].name).toEqual('Test Form 3');
    expect(result[2].description).toBeNull();
  });

  it('should return forms with correct field types', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'manager'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create a test form
    await db.insert(formsTable)
      .values({
        name: 'Type Test Form',
        description: 'Testing field types',
        created_by_user_id: userId,
        is_active: true
      })
      .execute();

    const result = await getAllForms();

    expect(result).toHaveLength(1);
    const form = result[0];

    expect(typeof form.id).toBe('number');
    expect(typeof form.name).toBe('string');
    expect(typeof form.description).toBe('string');
    expect(typeof form.created_by_user_id).toBe('number');
    expect(typeof form.is_active).toBe('boolean');
    expect(form.created_at).toBeInstanceOf(Date);
    expect(form.updated_at).toBeInstanceOf(Date);
  });
});
