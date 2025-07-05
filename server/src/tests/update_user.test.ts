
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user email', async () => {
    // Create test user
    const [createdUser] = await db.insert(usersTable)
      .values({
        email: 'original@example.com',
        password_hash: 'hashed_password',
        role: 'user'
      })
      .returning()
      .execute();

    const input: UpdateUserInput = {
      id: createdUser.id,
      email: 'updated@example.com'
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('updated@example.com');
    expect(result.role).toEqual('user'); // Should remain unchanged
    expect(result.password_hash).toEqual('hashed_password');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdUser.updated_at.getTime());
  });

  it('should update user role', async () => {
    // Create test user
    const [createdUser] = await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: 'hashed_password',
        role: 'user'
      })
      .returning()
      .execute();

    const input: UpdateUserInput = {
      id: createdUser.id,
      role: 'admin'
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('user@example.com'); // Should remain unchanged
    expect(result.role).toEqual('admin');
    expect(result.password_hash).toEqual('hashed_password');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdUser.updated_at.getTime());
  });

  it('should update both email and role', async () => {
    // Create test user
    const [createdUser] = await db.insert(usersTable)
      .values({
        email: 'original@example.com',
        password_hash: 'hashed_password',
        role: 'user'
      })
      .returning()
      .execute();

    const input: UpdateUserInput = {
      id: createdUser.id,
      email: 'updated@example.com',
      role: 'manager'
    };

    const result = await updateUser(input);

    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('updated@example.com');
    expect(result.role).toEqual('manager');
    expect(result.password_hash).toEqual('hashed_password');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(createdUser.updated_at.getTime());
  });

  it('should save updated user to database', async () => {
    // Create test user
    const [createdUser] = await db.insert(usersTable)
      .values({
        email: 'original@example.com',
        password_hash: 'hashed_password',
        role: 'user'
      })
      .returning()
      .execute();

    const input: UpdateUserInput = {
      id: createdUser.id,
      email: 'updated@example.com',
      role: 'admin'
    };

    await updateUser(input);

    // Verify changes are persisted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('updated@example.com');
    expect(users[0].role).toEqual('admin');
    expect(users[0].password_hash).toEqual('hashed_password');
    expect(users[0].updated_at).toBeInstanceOf(Date);
    expect(users[0].updated_at.getTime()).toBeGreaterThan(createdUser.updated_at.getTime());
  });

  it('should throw error when user does not exist', async () => {
    const input: UpdateUserInput = {
      id: 999999,
      email: 'nonexistent@example.com'
    };

    await expect(updateUser(input)).rejects.toThrow(/user not found/i);
  });

  it('should update only specified fields', async () => {
    // Create test user
    const [createdUser] = await db.insert(usersTable)
      .values({
        email: 'original@example.com',
        password_hash: 'hashed_password',
        role: 'user'
      })
      .returning()
      .execute();

    // Update only email
    const input: UpdateUserInput = {
      id: createdUser.id,
      email: 'updated@example.com'
    };

    const result = await updateUser(input);

    expect(result.email).toEqual('updated@example.com');
    expect(result.role).toEqual('user'); // Should remain unchanged
    expect(result.password_hash).toEqual('hashed_password'); // Should remain unchanged
  });
});
