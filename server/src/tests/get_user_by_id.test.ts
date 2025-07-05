
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type IdParam } from '../schema';
import { getUserById } from '../handlers/get_user_by_id';

describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user by ID', async () => {
    // Create test user
    const testUser = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = testUser[0].id;
    const params: IdParam = { id: userId };

    const result = await getUserById(params);

    expect(result.id).toEqual(userId);
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toEqual('hashed_password');
    expect(result.role).toEqual('user');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should return user with admin role', async () => {
    // Create admin user
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'admin_password_hash',
        role: 'admin'
      })
      .returning()
      .execute();

    const params: IdParam = { id: adminUser[0].id };

    const result = await getUserById(params);

    expect(result.role).toEqual('admin');
    expect(result.email).toEqual('admin@example.com');
  });

  it('should return user with manager role', async () => {
    // Create manager user
    const managerUser = await db.insert(usersTable)
      .values({
        email: 'manager@example.com',
        password_hash: 'manager_password_hash',
        role: 'manager'
      })
      .returning()
      .execute();

    const params: IdParam = { id: managerUser[0].id };

    const result = await getUserById(params);

    expect(result.role).toEqual('manager');
    expect(result.email).toEqual('manager@example.com');
  });

  it('should throw error when user not found', async () => {
    const params: IdParam = { id: 999 };

    await expect(getUserById(params)).rejects.toThrow(/User with ID 999 not found/i);
  });

  it('should handle multiple users correctly', async () => {
    // Create multiple users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'password1',
          role: 'user'
        },
        {
          email: 'user2@example.com',
          password_hash: 'password2',
          role: 'manager'
        }
      ])
      .returning()
      .execute();

    // Get first user
    const result1 = await getUserById({ id: users[0].id });
    expect(result1.email).toEqual('user1@example.com');
    expect(result1.role).toEqual('user');

    // Get second user
    const result2 = await getUserById({ id: users[1].id });
    expect(result2.email).toEqual('user2@example.com');
    expect(result2.role).toEqual('manager');
  });
});
