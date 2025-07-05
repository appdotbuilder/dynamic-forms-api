
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getCurrentUser } from '../handlers/get_current_user';

describe('getCurrentUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user when user exists', async () => {
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

    // Test getting current user
    const result = await getCurrentUser(userId);

    expect(result.id).toEqual(userId);
    expect(result.email).toEqual('test@example.com');
    expect(result.password_hash).toEqual('hashed_password');
    expect(result.role).toEqual('user');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const nonExistentUserId = 999;

    await expect(getCurrentUser(nonExistentUserId))
      .rejects
      .toThrow(/User not found/i);
  });

  it('should return correct user data for different roles', async () => {
    // Create manager user
    const managerUser = await db.insert(usersTable)
      .values({
        email: 'manager@example.com',
        password_hash: 'manager_hash',
        role: 'manager'
      })
      .returning()
      .execute();

    const result = await getCurrentUser(managerUser[0].id);

    expect(result.email).toEqual('manager@example.com');
    expect(result.role).toEqual('manager');
    expect(result.password_hash).toEqual('manager_hash');
  });

  it('should return admin user correctly', async () => {
    // Create admin user
    const adminUser = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'admin_hash',
        role: 'admin'
      })
      .returning()
      .execute();

    const result = await getCurrentUser(adminUser[0].id);

    expect(result.email).toEqual('admin@example.com');
    expect(result.role).toEqual('admin');
    expect(result.id).toEqual(adminUser[0].id);
  });
});
