
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type IdParam } from '../schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing user', async () => {
    // Create a test user first
    const testUser = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        role: 'user'
      })
      .returning()
      .execute();

    const userId = testUser[0].id;
    const params: IdParam = { id: userId };

    // Delete the user
    const result = await deleteUser(params);

    expect(result.success).toBe(true);

    // Verify user is deleted from database
    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(deletedUser).toHaveLength(0);
  });

  it('should throw error when user does not exist', async () => {
    const params: IdParam = { id: 999 };

    expect(deleteUser(params)).rejects.toThrow(/user not found/i);
  });

  it('should delete user with admin role', async () => {
    // Create a test admin user
    const testAdmin = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashedpassword123',
        role: 'admin'
      })
      .returning()
      .execute();

    const adminId = testAdmin[0].id;
    const params: IdParam = { id: adminId };

    // Delete the admin user
    const result = await deleteUser(params);

    expect(result.success).toBe(true);

    // Verify admin is deleted from database
    const deletedAdmin = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, adminId))
      .execute();

    expect(deletedAdmin).toHaveLength(0);
  });

  it('should delete user with manager role', async () => {
    // Create a test manager user
    const testManager = await db.insert(usersTable)
      .values({
        email: 'manager@example.com',
        password_hash: 'hashedpassword123',
        role: 'manager'
      })
      .returning()
      .execute();

    const managerId = testManager[0].id;
    const params: IdParam = { id: managerId };

    // Delete the manager user
    const result = await deleteUser(params);

    expect(result.success).toBe(true);

    // Verify manager is deleted from database
    const deletedManager = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, managerId))
      .execute();

    expect(deletedManager).toHaveLength(0);
  });
});
