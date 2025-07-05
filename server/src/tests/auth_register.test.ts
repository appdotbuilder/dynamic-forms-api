
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterInput } from '../schema';
import { authRegister } from '../handlers/auth_register';
import { eq } from 'drizzle-orm';

const testInput: RegisterInput = {
  email: 'test@example.com',
  password: 'testpassword123'
};

describe('authRegister', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user successfully', async () => {
    const result = await authRegister(testInput);

    // Verify user data
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.role).toEqual('user');
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
    expect(result.user.password_hash).toBeDefined();
    expect(result.user.password_hash).not.toEqual('testpassword123'); // Password should be hashed

    // Verify token is generated
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);
  });

  it('should save user to database with correct role', async () => {
    const result = await authRegister(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].role).toEqual('user');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await authRegister(testInput);

    // Verify password is hashed and not stored as plain text
    expect(result.user.password_hash).not.toEqual('testpassword123');
    expect(result.user.password_hash.length).toBeGreaterThan(20); // Hashed passwords are longer

    // Verify password can be verified (using Bun's password utilities)
    const isValid = await Bun.password.verify('testpassword123', result.user.password_hash);
    expect(isValid).toBe(true);
  });

  it('should throw error for duplicate email', async () => {
    // Register first user
    await authRegister(testInput);

    // Try to register another user with same email
    await expect(authRegister(testInput)).rejects.toThrow(/already exists/i);
  });

  it('should generate valid token with user info', async () => {
    const result = await authRegister(testInput);

    // Decode token to verify it contains user information
    const decodedToken = JSON.parse(atob(result.token));
    expect(decodedToken.userId).toEqual(result.user.id);
    expect(decodedToken.email).toEqual('test@example.com');
    expect(decodedToken.role).toEqual('user');
    expect(decodedToken.timestamp).toBeDefined();
    expect(typeof decodedToken.timestamp).toBe('number');
  });

  it('should handle different email formats', async () => {
    const emailVariations = [
      'user@domain.com',
      'test.user@example.org',
      'user+tag@domain.co.uk'
    ];

    for (const email of emailVariations) {
      const input = { ...testInput, email };
      const result = await authRegister(input);
      
      expect(result.user.email).toEqual(email);
      expect(result.user.role).toEqual('user');
    }
  });
});
