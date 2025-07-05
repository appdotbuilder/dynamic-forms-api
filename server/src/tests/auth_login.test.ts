
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { authLogin } from '../handlers/auth_login';

// Test user data
const testUser = {
  email: 'test@example.com',
  password_hash: 'test_password_123',
  role: 'user' as const
};

const testInput: LoginInput = {
  email: 'test@example.com',
  password: 'test_password_123'
};

describe('authLogin', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result = await authLogin(testInput);

    // Verify response structure
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
    expect(result.token.length).toBeGreaterThan(0);

    // Verify user data
    expect(result.user.email).toEqual(testUser.email);
    expect(result.user.password_hash).toEqual(testUser.password_hash);
    expect(result.user.role).toEqual(testUser.role);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
  });

  it('should reject login with invalid email', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'test_password_123'
    };

    await expect(authLogin(invalidInput)).rejects.toThrow(/invalid credentials/i);
  });

  it('should reject login with invalid password', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const invalidInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrong_password'
    };

    await expect(authLogin(invalidInput)).rejects.toThrow(/invalid credentials/i);
  });

  it('should return different tokens for different login attempts', async () => {
    // Create test user
    await db.insert(usersTable)
      .values(testUser)
      .execute();

    const result1 = await authLogin(testInput);
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result2 = await authLogin(testInput);

    expect(result1.token).not.toEqual(result2.token);
    expect(result1.user.email).toEqual(result2.user.email);
  });

  it('should authenticate user with different roles', async () => {
    // Create admin user
    const adminUser = {
      email: 'admin@example.com',
      password_hash: 'admin_password',
      role: 'admin' as const
    };

    await db.insert(usersTable)
      .values(adminUser)
      .execute();

    const adminInput: LoginInput = {
      email: 'admin@example.com',
      password: 'admin_password'
    };

    const result = await authLogin(adminInput);

    expect(result.user.role).toEqual('admin');
    expect(result.user.email).toEqual(adminUser.email);
    expect(result.token).toBeDefined();
  });
});
