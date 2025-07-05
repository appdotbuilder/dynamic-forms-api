
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { formsTable, usersTable } from '../db/schema';
import { getAvailableForms } from '../handlers/get_available_forms';

describe('getAvailableForms', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all active forms', async () => {
    // Create a test user first
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    // Create active forms
    await db.insert(formsTable).values([
      {
        name: 'Active Form 1',
        description: 'First active form',
        created_by_user_id: user[0].id,
        is_active: true
      },
      {
        name: 'Active Form 2',
        description: 'Second active form',
        created_by_user_id: user[0].id,
        is_active: true
      }
    ]).execute();

    const result = await getAvailableForms();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Active Form 1');
    expect(result[0].description).toEqual('First active form');
    expect(result[0].is_active).toBe(true);
    expect(result[1].name).toEqual('Active Form 2');
    expect(result[1].description).toEqual('Second active form');
    expect(result[1].is_active).toBe(true);
  });

  it('should not return inactive forms', async () => {
    // Create a test user first
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    // Create one active and one inactive form
    await db.insert(formsTable).values([
      {
        name: 'Active Form',
        description: 'This form is active',
        created_by_user_id: user[0].id,
        is_active: true
      },
      {
        name: 'Inactive Form',
        description: 'This form is inactive',
        created_by_user_id: user[0].id,
        is_active: false
      }
    ]).execute();

    const result = await getAvailableForms();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Active Form');
    expect(result[0].is_active).toBe(true);
  });

  it('should return empty array when no active forms exist', async () => {
    // Create a test user first
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'user'
      })
      .returning()
      .execute();

    // Create only inactive forms
    await db.insert(formsTable).values([
      {
        name: 'Inactive Form 1',
        description: 'First inactive form',
        created_by_user_id: user[0].id,
        is_active: false
      },
      {
        name: 'Inactive Form 2',
        description: 'Second inactive form',
        created_by_user_id: user[0].id,
        is_active: false
      }
    ]).execute();

    const result = await getAvailableForms();

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no forms exist', async () => {
    const result = await getAvailableForms();

    expect(result).toHaveLength(0);
  });
});
